import { describe, expect, it } from 'vitest';
import { FakeClock, SeededRng , makeInMemoryRepos } from '../../testing/index.js';
import { StaticSrdProvider } from '../../domain/srd/index.js';
import { projectLiveTable } from '../../domain/visibility/index.js';
import type { CampaignId, LiveTableId, UserId } from '../../domain/ids.js';
import type { Combatant, LiveTable } from '../../domain/types.js';
import type { Command } from '@grimorio/shared/commands';
import { dispatchLiveCommand } from './dispatch.js';
import type { Deps, Principal } from './principal.js';
import { CombatantNotFound, Forbidden, InvalidNotation, NotActiveTurn } from './errors.js';

// ---------- fixture ----------

const DM_ID = 'usr_dm' as UserId;
const PLAYER_ID = 'usr_player' as UserId;
const OTHER_PLAYER_ID = 'usr_player2' as UserId;

const dm: Principal = { userId: DM_ID, role: 'dm' };
const player: Principal = { userId: PLAYER_ID, role: 'player' };
const otherPlayer: Principal = { userId: OTHER_PLAYER_ID, role: 'player' };

const dmViewer = { userId: DM_ID, role: 'dm' as const };
const playerViewer = { userId: PLAYER_ID, role: 'player' as const };

/** PC combatant controlled by PLAYER_ID — refId holds the CharacterId, controllerUserId the owner. */
const pc: Combatant = {
  id: 'cbt_pc' as Combatant['id'],
  refId: 'char_lyra',
  controllerUserId: PLAYER_ID,
  type: 'pc',
  name: 'Lyra',
  initiative: 18,
  maxHp: 30,
  currentHp: 30,
  conditions: [],
  hpVisibility: 'public',
};

/** Hidden monster combatant — players only see a derived status label. */
const monster: Combatant = {
  id: 'cbt_mon' as Combatant['id'],
  refId: 'goblin',
  type: 'monster',
  name: 'Goblin',
  initiative: 12,
  maxHp: 7,
  currentHp: 7,
  conditions: [],
  hpVisibility: 'dm_only',
};

function makeTable(overrides: Partial<LiveTable> = {}): LiveTable {
  return {
    id: 'tbl_1' as LiveTableId,
    campaignId: 'cmp_1' as CampaignId,
    combatants: [pc, monster],
    combat: {
      active: true,
      round: 1,
      order: [pc.id, monster.id],
      currentTurnIndex: 0, // pc (Lyra) is active
    },
    rollLog: [],
    eventLog: [],
    dmNotes: '',
    version: 1,
    ...overrides,
  };
}

function makeDeps(rng = new SeededRng([15, 4])): Deps {
  const repos = makeInMemoryRepos();
  return {
    tables: repos.liveTables,
    srd: new StaticSrdProvider(),
    rng,
    clock: new FakeClock(),
  };
}

/**
 * The cross-cutting visibility guarantee: a player's projection of the table
 * must never leak dm-only secrets (dm notes, dm_only rolls, numeric HP of a
 * hidden combatant).
 */
function assertPlayerSeesNoSecrets(table: LiveTable): void {
  const snapshot = projectLiveTable(table, playerViewer);
  expect(snapshot.viewerRole).toBe('player');
  // No dmNotes field on a PlayerSnapshot at all.
  expect('dmNotes' in snapshot).toBe(false);
  // No dm_only rolls.
  expect(snapshot.rollLog.every((r) => r.visibility !== 'dm_only')).toBe(true);
  // No dm_only events.
  expect(snapshot.eventLog.every((e) => e.visibility !== 'dm_only')).toBe(true);
  // Any dm_only combatant on the table is shown to the player as a status label
  // only — never numeric HP. (Identify them from the table's source combatants.)
  const hiddenIds = new Set(
    table.combatants.filter((c) => c.hpVisibility === 'dm_only').map((c) => c.id),
  );
  for (const c of snapshot.combatants) {
    if (!hiddenIds.has(c.id as Combatant['id'])) continue;
    expect(c.currentHp).toBeUndefined();
    expect(c.maxHp).toBeUndefined();
    expect(c.statusLabel).toBeDefined();
  }
}

// ---------- authorization ----------

describe('authorization', () => {
  it('a player issuing NextTurn is Forbidden', () => {
    const table = makeTable();
    expect(() =>
      dispatchLiveCommand(table, { type: 'NextTurn' } as Command, player, makeDeps()),
    ).toThrow(Forbidden);
  });

  it('the active player can EndMyTurn and the turn advances', () => {
    const table = makeTable(); // pc (Lyra/PLAYER_ID) is active
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'EndMyTurn' } as Command,
      player,
      makeDeps(),
    );
    expect(next.combat.currentTurnIndex).toBe(1); // advanced to the monster
    expect(next.version).toBe(table.version + 1);
    assertPlayerSeesNoSecrets(next);
  });

  it('a non-active player issuing EndMyTurn gets NotActiveTurn', () => {
    const table = makeTable(); // Lyra (PLAYER_ID) is active, not OTHER_PLAYER_ID
    expect(() =>
      dispatchLiveCommand(table, { type: 'EndMyTurn' } as Command, otherPlayer, makeDeps()),
    ).toThrow(NotActiveTurn);
  });

  it('the DM may issue NextTurn', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'NextTurn' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combat.currentTurnIndex).toBe(1);
    assertPlayerSeesNoSecrets(next);
  });
});

// ---------- bestiary ----------

describe('AddCombatantFromBestiary', () => {
  it('pulls a monster from the SRD and adds a dm_only combatant', () => {
    const table = makeTable({ combatants: [pc] });
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'AddCombatantFromBestiary', monsterId: 'goblin', hpVisibility: 'dm_only' } as Command,
      dm,
      makeDeps(),
    );
    const added = next.combatants.find((c) => c.refId === 'goblin');
    expect(added).toBeDefined();
    expect(added?.type).toBe('monster');
    expect(added?.hpVisibility).toBe('dm_only');
    expect(added?.maxHp).toBe(7); // goblin hp from the SRD
    expect(added?.currentHp).toBe(7);
    assertPlayerSeesNoSecrets(next);
  });

  it('an unknown monster id throws CombatantNotFound', () => {
    const table = makeTable({ combatants: [pc] });
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'AddCombatantFromBestiary', monsterId: 'nope', hpVisibility: 'dm_only' } as Command,
        dm,
        makeDeps(),
      ),
    ).toThrow(CombatantNotFound);
  });

  it('a player cannot add a combatant (Forbidden)', () => {
    const table = makeTable({ combatants: [pc] });
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'AddCombatantFromBestiary', monsterId: 'goblin', hpVisibility: 'dm_only' } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });
});

// ---------- hp ----------

describe('ApplyDamage', () => {
  it('clamps to 0 and emits an HpChanged event with a CombatEvent', () => {
    const table = makeTable();
    const { table: next, events } = dispatchLiveCommand(
      table,
      { type: 'ApplyDamage', combatantId: monster.id, amount: 999 } as Command,
      dm,
      makeDeps(),
    );
    const hurt = next.combatants.find((c) => c.id === monster.id);
    expect(hurt?.currentHp).toBe(0);
    expect(next.eventLog.length).toBe(1);
    const ev = events[0];
    expect(ev.type).toBe('HpChanged');
    expect(ev.type === 'HpChanged' && ev.event).toBeDefined();
    assertPlayerSeesNoSecrets(next);
  });

  it('a player may apply damage to their own character', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'ApplyDamage', combatantId: pc.id, amount: 5 } as Command,
      player,
      makeDeps(),
    );
    expect(next.combatants.find((c) => c.id === pc.id)!.currentHp).toBe(25);
  });
});

describe('ApplyHealing', () => {
  it('clamps to maxHp', () => {
    const damaged: Combatant = { ...pc, currentHp: 5 };
    const table = makeTable({ combatants: [damaged, monster] });
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'ApplyHealing', combatantId: pc.id, amount: 999 } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combatants.find((c) => c.id === pc.id)?.currentHp).toBe(pc.maxHp);
    assertPlayerSeesNoSecrets(next);
  });
});

// ---------- dice ----------

describe('rolls and visibility', () => {
  it('RollHidden produces a dm_only roll a player cannot see, but the dm can', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'RollHidden', notation: '1d20' } as Command,
      dm,
      makeDeps(new SeededRng([15])),
    );
    expect(next.rollLog.length).toBe(1);
    expect(next.rollLog[0].visibility).toBe('dm_only');

    const playerSnap = projectLiveTable(next, playerViewer);
    expect(playerSnap.rollLog.some((r) => r.id === next.rollLog[0].id)).toBe(false);

    const dmSnap = projectLiveTable(next, dmViewer);
    expect(dmSnap.rollLog.some((r) => r.id === next.rollLog[0].id)).toBe(true);

    assertPlayerSeesNoSecrets(next);
  });

  it('RollDice (public) is visible to a player', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'RollDice', notation: '2d6+3', visibility: 'public' } as Command,
      player,
      makeDeps(new SeededRng([4, 5])),
    );
    expect(next.rollLog[0].visibility).toBe('public');
    const playerSnap = projectLiveTable(next, playerViewer);
    expect(playerSnap.rollLog.some((r) => r.id === next.rollLog[0].id)).toBe(true);
    assertPlayerSeesNoSecrets(next);
  });

  it('RollDice forces public even if a player asks for dm_only', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'RollDice', notation: '1d20', visibility: 'dm_only' } as Command,
      player,
      makeDeps(new SeededRng([10])),
    );
    expect(next.rollLog[0].visibility).toBe('public');
  });

  it('RollDice with invalid notation throws InvalidNotation', () => {
    const table = makeTable();
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'RollDice', notation: 'banana', visibility: 'public' } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(InvalidNotation);
  });

  it('RollHidden is DM-only (a player is Forbidden)', () => {
    const table = makeTable();
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'RollHidden', notation: '1d20' } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });

  it('RollAttack rolls to-hit + damage and is public', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'RollAttack', name: 'Cimitarra', toHitBonus: 4, damage: '1d6+2' } as Command,
      dm,
      makeDeps(new SeededRng([18, 5])),
    );
    expect(next.rollLog[0].visibility).toBe('public');
    expect(next.rollLog[0].notation).toBe('Cimitarra');
    assertPlayerSeesNoSecrets(next);
  });
});

// ---------- conditions / initiative / notes / lifecycle ----------

describe('other handlers keep the visibility guarantee', () => {
  it('StartCombat orders by initiative', () => {
    const table = makeTable({
      combat: { active: false, round: 1, order: [], currentTurnIndex: 0 },
    });
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'StartCombat' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combat.active).toBe(true);
    expect(next.combat.order[0]).toBe(pc.id); // 18 > 12
    assertPlayerSeesNoSecrets(next);
  });

  it('SetCondition adds a condition', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      {
        type: 'SetCondition',
        combatantId: pc.id,
        condition: { key: 'poisoned', label: 'Envenenado', color: 'green' },
      } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combatants.find((c) => c.id === pc.id)?.conditions).toHaveLength(1);
    assertPlayerSeesNoSecrets(next);
  });

  it('ClearCondition removes a condition', () => {
    const poisoned: Combatant = {
      ...pc,
      conditions: [{ key: 'poisoned', label: 'Envenenado', color: 'green' }],
    };
    const table = makeTable({ combatants: [poisoned, monster] });
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'ClearCondition', combatantId: pc.id, conditionKey: 'poisoned' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combatants.find((c) => c.id === pc.id)?.conditions).toHaveLength(0);
    assertPlayerSeesNoSecrets(next);
  });

  it('SetInitiative updates a combatant', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'SetInitiative', combatantId: monster.id, initiative: 20 } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combatants.find((c) => c.id === monster.id)?.initiative).toBe(20);
    assertPlayerSeesNoSecrets(next);
  });

  it('ReorderInitiative replaces the order', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'ReorderInitiative', order: [monster.id, pc.id] } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combat.order).toEqual([monster.id, pc.id]);
    assertPlayerSeesNoSecrets(next);
  });

  it('AddManualCombatant adds a combatant', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      {
        type: 'AddManualCombatant',
        name: 'Trampa',
        maxHp: 10,
        initiative: 5,
        combatantType: 'monster',
        hpVisibility: 'public',
        refId: null,
      } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combatants).toHaveLength(3);
    expect(next.combatants.at(-1)?.name).toBe('Trampa');
    assertPlayerSeesNoSecrets(next);
  });

  it('AppendDmNote updates dmNotes (never visible to a player)', () => {
    const table = makeTable();
    const { table: next, events } = dispatchLiveCommand(
      table,
      { type: 'AppendDmNote', notes: 'El goblin huye a 5 PV' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.dmNotes).toContain('El goblin huye');
    expect(events[0].type).toBe('DmNotesUpdated');
    assertPlayerSeesNoSecrets(next); // PlayerSnapshot has no dmNotes field at all
  });

  it('a player cannot AppendDmNote (Forbidden)', () => {
    const table = makeTable();
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'AppendDmNote', notes: 'secret' } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });

  it('EndCombat deactivates combat', () => {
    const table = makeTable();
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'EndCombat' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combat.active).toBe(false);
    assertPlayerSeesNoSecrets(next);
  });

  it('PrevTurn moves the turn back', () => {
    const table = makeTable({
      combat: { active: true, round: 1, order: [pc.id, monster.id], currentTurnIndex: 1 },
    });
    const { table: next } = dispatchLiveCommand(
      table,
      { type: 'PrevTurn' } as Command,
      dm,
      makeDeps(),
    );
    expect(next.combat.currentTurnIndex).toBe(0);
    assertPlayerSeesNoSecrets(next);
  });
});

describe('HP authorization (damage / heal)', () => {
  it('a player can damage a monster even when it is not their turn', () => {
    // Make the monster active (so it is NOT the player's turn).
    const table = makeTable({
      combat: { active: true, round: 1, order: [monster.id, pc.id], currentTurnIndex: 0 },
    });
    const next = dispatchLiveCommand(
      table,
      { type: 'ApplyDamage', combatantId: monster.id, amount: 3 } as Command,
      player,
      makeDeps(),
    );
    const hit = next.table.combatants.find((c) => c.id === monster.id)!;
    expect(hit.currentHp).toBe(4);
  });

  it('a player can damage and heal their own character', () => {
    const dmg = dispatchLiveCommand(
      makeTable(),
      { type: 'ApplyDamage', combatantId: pc.id, amount: 10 } as Command,
      player,
      makeDeps(),
    );
    expect(dmg.table.combatants.find((c) => c.id === pc.id)!.currentHp).toBe(20);
    const heal = dispatchLiveCommand(
      dmg.table,
      { type: 'ApplyHealing', combatantId: pc.id, amount: 5 } as Command,
      player,
      makeDeps(),
    );
    expect(heal.table.combatants.find((c) => c.id === pc.id)!.currentHp).toBe(25);
  });

  it("a player cannot damage another player's character", () => {
    const ally: Combatant = { ...pc, id: 'cbt_ally' as Combatant['id'], controllerUserId: OTHER_PLAYER_ID };
    const table = makeTable({ combatants: [pc, ally, monster] });
    expect(() =>
      dispatchLiveCommand(
        table,
        { type: 'ApplyDamage', combatantId: ally.id, amount: 3 } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });

  it('a player cannot heal a monster or another player', () => {
    expect(() =>
      dispatchLiveCommand(
        makeTable(),
        { type: 'ApplyHealing', combatantId: monster.id, amount: 3 } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });

  it('the DM can damage any combatant on any turn', () => {
    const next = dispatchLiveCommand(
      makeTable(),
      { type: 'ApplyDamage', combatantId: monster.id, amount: 2 } as Command,
      dm,
      makeDeps(),
    );
    expect(next.table.combatants.find((c) => c.id === monster.id)!.currentHp).toBe(5);
  });
});

describe('AddCombatantFromBestiary — multiple monsters', () => {
  it('numbers duplicates and adds each as a distinct combatant', () => {
    const empty = makeTable({ combatants: [], combat: { active: false, round: 0, order: [], currentTurnIndex: 0 } });
    const first = dispatchLiveCommand(
      empty,
      { type: 'AddCombatantFromBestiary', monsterId: 'goblin', hpVisibility: 'dm_only' } as Command,
      dm,
      makeDeps(),
    );
    const second = dispatchLiveCommand(
      first.table,
      { type: 'AddCombatantFromBestiary', monsterId: 'goblin', hpVisibility: 'dm_only' } as Command,
      dm,
      makeDeps(),
    );
    const monsters = second.table.combatants.filter((c) => c.type === 'monster');
    expect(monsters).toHaveLength(2);
    expect(monsters[0].name).toBe('Goblin');
    expect(monsters[1].name).toBe('Goblin 2');
    expect(monsters[0].id).not.toBe(monsters[1].id);
  });
});

describe('RemoveCombatant', () => {
  it('the DM removes a combatant from the table and the turn order', () => {
    const next = dispatchLiveCommand(
      makeTable(),
      { type: 'RemoveCombatant', combatantId: monster.id } as Command,
      dm,
      makeDeps(),
    );
    expect(next.table.combatants.some((c) => c.id === monster.id)).toBe(false);
    expect(next.table.combat.order.includes(monster.id)).toBe(false);
  });

  it('a player cannot remove a combatant (Forbidden)', () => {
    expect(() =>
      dispatchLiveCommand(
        makeTable(),
        { type: 'RemoveCombatant', combatantId: monster.id } as Command,
        player,
        makeDeps(),
      ),
    ).toThrow(Forbidden);
  });
});
