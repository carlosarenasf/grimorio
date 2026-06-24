import { useState } from 'react';
import { Button, Panel } from '../../design';
import type { PlayerSnapshot, Send } from './types';

export interface MonsterTargetsPanelProps {
  snapshot: PlayerSnapshot;
  send: Send;
}

/**
 * "Atacar a un monstruo": lets a player apply damage to any monster, on or off
 * their turn (the server authorizes player→monster damage). Players never see a
 * monster's numeric HP — only the public status label — so this shows that.
 */
export function MonsterTargetsPanel({ snapshot, send }: MonsterTargetsPanelProps) {
  const monsters = snapshot.combatants.filter((c) => c.type === 'monster');
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  if (monsters.length === 0) return null;

  return (
    <Panel eyebrow="Combate" title="Atacar a un monstruo">
      <ul className="vj-targets" aria-label="Monstruos">
        {monsters.map((m) => {
          const raw = amounts[m.id] ?? '1';
          const amt = Math.max(0, Math.round(Number(raw) || 0));
          return (
            <li key={m.id} className="vj-targets__row">
              <span className="vj-targets__name">{m.name}</span>
              {m.statusLabel ? (
                <span className="vj-targets__status">{m.statusLabel}</span>
              ) : null}
              <input
                type="number"
                min={0}
                value={raw}
                onChange={(e) => setAmounts((p) => ({ ...p, [m.id]: e.target.value }))}
                aria-label={`Daño a ${m.name}`}
                className="vj-targets__amount"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={amt <= 0}
                onClick={() => send({ type: 'ApplyDamage', combatantId: m.id, amount: amt })}
              >
                Daño
              </Button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
