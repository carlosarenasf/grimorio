import { useRef, useState } from 'react';
import '../../design/tokens.css';
import '../../design/components.css';
import { InitiativeRail } from '../../design';
import type { InitiativeToken } from '../../design';
import { getActiveCombatant } from '../../net';
import type { MasterSnapshot, Send, SrdSource } from './types';
import { SessionBar } from './SessionBar';
import { CombatantsPanel } from './CombatantsPanel';
import { PlayersPanel } from './PlayersPanel';
import { BestiaryPanel } from './BestiaryPanel';
import { QuickReferencePanel } from './QuickReferencePanel';
import { ActiveTurnPanel } from './ActiveTurnPanel';
import { DicePanel } from './DicePanel';
import { HistoryPanel } from './HistoryPanel';
import { DmNotesPanel } from './DmNotesPanel';
import { ActionBar } from './ActionBar';
import { CharacterSheetModal } from './CharacterSheetModal';
import type { ApiClient, SpellDTO } from '../../net/http';
import './vista-master.css';

export interface VistaMasterScreenProps {
  /** The master's full, role-filtered snapshot. */
  snapshot: MasterSnapshot;
  /** Command sink (wired to LiveConnection.send in production; a spy in tests). */
  send: Send;
  /** Injected SRD bestiary source for the Bestiario panel. */
  srd: SrdSource;
  /** Campaign characters (for the Jugadores panel); the DM seats them into battle. */
  campaignCharacters?: { id: string; name: string }[];
  /** API client + SRD spell map enable the DM to open a player's character sheet. */
  api?: ApiClient;
  spellsById?: Record<string, SpellDTO>;
}

function toRailTokens(snapshot: MasterSnapshot): InitiativeToken[] {
  return snapshot.combatants.map((c) => ({
    id: c.id,
    name: c.name,
    initiative: c.initiative,
    type: c.type,
    hp: c.currentHp,
    maxHp: c.maxHp,
    statusLabel: c.statusLabel,
    conditions: c.conditions.map((cond) => ({
      label: cond.label,
      color: cond.color,
    })),
  }));
}

/**
 * Vista Máster (DESIGN_SPEC.md §5): the DM dashboard. A 3-column dense layout
 * around the central initiative rail + active-turn panel, with a top session
 * bar and a bottom action bar. Renders from a MasterSnapshot and emits commands
 * through `send`. Fully prop-injected for testability (no WebSocket required).
 */
export function VistaMasterScreen({
  snapshot,
  send,
  srd,
  campaignCharacters = [],
  api,
  spellsById = {},
}: VistaMasterScreenProps) {
  const [sheetCharacterId, setSheetCharacterId] = useState<string | null>(null);
  const seatedCharacterIds = snapshot.combatants
    .filter((c) => c.type === 'pc' && c.characterId)
    .map((c) => c.characterId as string);
  const active = getActiveCombatant(snapshot);
  const activeId = active?.id ?? null;

  // The HP controls target the active combatant by default, but the master can
  // re-target any combatant by selecting it in the Combatientes panel.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const targetId = selectedId ?? activeId ?? snapshot.combatants[0]?.id ?? null;

  const [amount, setAmount] = useState('1');
  const diceRef = useRef<HTMLDivElement>(null);
  const latestRoll = snapshot.rollLog.length
    ? snapshot.rollLog[snapshot.rollLog.length - 1]
    : null;

  function focusDice() {
    const input = diceRef.current?.querySelector('input');
    if (input instanceof HTMLInputElement) input.focus();
  }

  return (
    <div className="vm-screen">
      <SessionBar snapshot={snapshot} activeName={active?.name ?? null} />

      <div className="vm-grid">
        <aside className="vm-col vm-col--left" aria-label="Paneles izquierda">
          <CombatantsPanel
            snapshot={snapshot}
            selectedId={targetId}
            onSelect={setSelectedId}
            onDamage={(id, amount) =>
              send({ type: 'ApplyDamage', combatantId: id, amount })
            }
            onHeal={(id, amount) =>
              send({ type: 'ApplyHealing', combatantId: id, amount })
            }
            onRemove={(id) => send({ type: 'RemoveCombatant', combatantId: id })}
            onViewSheet={api ? (cid) => setSheetCharacterId(cid) : undefined}
          />
          <PlayersPanel
            characters={campaignCharacters}
            seatedCharacterIds={seatedCharacterIds}
            onSeat={(characterId) => send({ type: 'SeatPlayer', characterId })}
          />
          <BestiaryPanel srd={srd} send={send} />
          <QuickReferencePanel />
        </aside>

        <main className="vm-col vm-col--center" aria-label="Mesa central">
          <InitiativeRail
            tokens={toRailTokens(snapshot)}
            activeId={activeId}
            className="vm-rail"
          />
          <ActiveTurnPanel
            snapshot={snapshot}
            send={send}
            targetId={targetId}
            amount={amount}
            onAmountChange={setAmount}
          />
        </main>

        <aside className="vm-col vm-col--right" aria-label="Paneles derecha">
          <div ref={diceRef}>
            <DicePanel send={send} latestRoll={latestRoll} />
          </div>
          <HistoryPanel snapshot={snapshot} />
          <DmNotesPanel snapshot={snapshot} send={send} />
        </aside>
      </div>

      <ActionBar
        snapshot={snapshot}
        send={send}
        targetId={targetId}
        amount={amount}
        onFocusDice={focusDice}
      />

      {api && sheetCharacterId ? (
        <CharacterSheetModal
          characterId={sheetCharacterId}
          api={api}
          spellsById={spellsById}
          onClose={() => setSheetCharacterId(null)}
        />
      ) : null}
    </div>
  );
}
