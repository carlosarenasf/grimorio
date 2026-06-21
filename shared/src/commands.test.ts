import { describe, expect, test } from 'vitest';
import { CommandSchema, RollDiceSchema } from './commands.js';

describe('RollDice command', () => {
  test('parses a valid RollDice command', () => {
    const result = CommandSchema.safeParse({
      type: 'RollDice',
      notation: '2d6+3',
      visibility: 'public',
    });
    expect(result.success).toBe(true);
  });

  test('rejects a RollDice with empty notation', () => {
    const result = RollDiceSchema.safeParse({ type: 'RollDice', notation: '' });
    expect(result.success).toBe(false);
  });

  test('rejects an unknown command type', () => {
    const result = CommandSchema.safeParse({ type: 'Nope', foo: 1 });
    expect(result.success).toBe(false);
  });
});

describe('discriminated union', () => {
  test('parses a Register command', () => {
    const result = CommandSchema.safeParse({
      type: 'Register',
      email: 'a@b.co',
      password: 'hunter2hunter2',
      displayName: 'Lyra',
    });
    expect(result.success).toBe(true);
  });

  test('parses every command type by its discriminant', () => {
    const samples: Array<Record<string, unknown>> = [
      { type: 'Register', email: 'a@b.co', password: 'hunter2hunter2', displayName: 'L' },
      { type: 'Login', email: 'a@b.co', password: 'hunter2hunter2' },
      { type: 'CreateCampaign', name: 'Curse', tagline: '' },
      { type: 'UpdateCampaign', campaignId: 'cmp_1', status: 'active' },
      { type: 'InviteToCampaign', campaignId: 'cmp_1' },
      { type: 'JoinCampaign', joinCode: 'RAVEN-77' },
      {
        type: 'CreateCharacter',
        campaignId: 'cmp_1',
        name: 'Brom',
        species: 'Elfo',
        className: 'Mago',
        background: 'Sabio',
        level: 1,
        scores: { str: 10, dex: 12, con: 13, int: 15, wis: 8, cha: 14 },
        method: 'buy',
      },
      { type: 'UpdateCharacter', characterId: 'chr_1', patch: { name: 'Brom II' } },
      { type: 'StartCombat' },
      { type: 'AddCombatantFromBestiary', monsterId: 'orc' },
      {
        type: 'AddManualCombatant',
        name: 'Bandido',
        maxHp: 11,
        initiative: 12,
        combatantType: 'monster',
      },
      { type: 'SetInitiative', combatantId: 'cbt_1', initiative: 17 },
      { type: 'ReorderInitiative', order: ['cbt_1', 'cbt_2'] },
      { type: 'NextTurn' },
      { type: 'PrevTurn' },
      { type: 'EndMyTurn' },
      {
        type: 'SetCondition',
        combatantId: 'cbt_1',
        condition: { key: 'poisoned', label: 'Envenenado', color: '#0a0' },
      },
      { type: 'ClearCondition', combatantId: 'cbt_1', conditionKey: 'poisoned' },
      { type: 'ApplyDamage', combatantId: 'cbt_1', amount: 5 },
      { type: 'ApplyHealing', combatantId: 'cbt_1', amount: 5 },
      { type: 'RollDice', notation: '1d20', visibility: 'public' },
      { type: 'RollAttack', name: 'Espada larga', toHitBonus: 5, damage: '1d8+3' },
      { type: 'RollHidden', notation: '1d20' },
      { type: 'AppendDmNote', notes: 'El dragón duerme.' },
      { type: 'EndCombat' },
    ];
    for (const s of samples) {
      const result = CommandSchema.safeParse(s);
      if (!result.success) {
        throw new Error(`${String(s.type)} failed: ${result.error.message}`);
      }
      expect(result.success).toBe(true);
    }
  });

  test('rejects ApplyDamage with negative amount', () => {
    const result = CommandSchema.safeParse({
      type: 'ApplyDamage',
      combatantId: 'cbt_1',
      amount: -3,
    });
    expect(result.success).toBe(false);
  });
});
