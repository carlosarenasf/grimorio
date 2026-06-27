import '../../design/tokens.css';
import '../../design/components.css';
import { getActiveCombatant } from '../../net';
import { ActionBar } from './ActionBar';
import { ActionEconomy } from './ActionEconomy';
import { DicePanel } from './DicePanel';
import { InventoryPanel } from './InventoryPanel';
import { MonsterTargetsPanel } from './MonsterTargetsPanel';
import { PublicLogPanel } from './PublicLogPanel';
import { PublicRailPanel } from './PublicRailPanel';
import { RulesPanel } from './RulesPanel';
import { SheetPanel } from './SheetPanel';
import { TurnBanner } from './TurnBanner';
import type { PlayerSnapshot, Send, YouCharacter } from './types';
import './vista-jugador.css';

export interface VistaJugadorScreenProps {
  /** Role-filtered live-table snapshot (server already stripped dm_only data). */
  snapshot: PlayerSnapshot;
  /** The viewer's own character — sheet, attacks, inventory, gold. */
  you: YouCharacter;
  /** Command sink — the screen's only side effect. */
  send: Send;
  /** Weapon catalogue + persisting equip callbacks (wired in production). */
  weapons?: import('../../net/http').WeaponDTO[];
  onAddWeapon?: (weapon: import('../../net/http').WeaponDTO) => void;
  onAddItem?: (name: string) => void;
  onRemoveItem?: (id: string) => void;
  onAdjustItem?: (id: string, delta: number) => void;
}

/**
 * Vista Jugador (DESIGN_SPEC.md §5): the player's screen. Cleaner than the
 * master view — a turn banner, TU FICHA, the "¿Qué haces?" action economy,
 * Equipo e inventario, Normas básicas on the left/main column; the public
 * Initiative Rail, Dados and the public roll log on the right; "Tirar d20" +
 * "Terminar turno →" in the bottom bar.
 */
export function VistaJugadorScreen({
  snapshot,
  you,
  send,
  weapons,
  onAddWeapon,
  onAddItem,
  onRemoveItem,
  onAdjustItem,
}: VistaJugadorScreenProps) {
  const active = getActiveCombatant(snapshot);
  const isYourTurn =
    snapshot.combat.active && active !== null && active.id === you.combatantId;
  const latestRoll = snapshot.rollLog.length
    ? snapshot.rollLog[snapshot.rollLog.length - 1]
    : null;

  return (
    <div className="vj-screen">
      <TurnBanner
        isYourTurn={isYourTurn}
        activeName={active?.name ?? null}
        round={snapshot.combat.round}
        combatActive={snapshot.combat.active}
      />

      <div className="vj-screen__body">
        <main className="vj-screen__main">
          <SheetPanel you={you} send={send} latestRoll={latestRoll} />
          <ActionEconomy you={you} send={send} isYourTurn={isYourTurn} />
          <MonsterTargetsPanel snapshot={snapshot} send={send} />
          <InventoryPanel
            you={you}
            send={send}
            weapons={weapons}
            onAddWeapon={onAddWeapon}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onAdjustItem={onAdjustItem}
          />
          <RulesPanel />
        </main>

        <aside className="vj-screen__side">
          <PublicRailPanel snapshot={snapshot} />
          <DicePanel send={send} latestRoll={latestRoll} />
          <PublicLogPanel snapshot={snapshot} />
        </aside>
      </div>

      <ActionBar send={send} isYourTurn={isYourTurn} />
    </div>
  );
}
