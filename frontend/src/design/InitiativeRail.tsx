import type { CSSProperties } from 'react';
import { StatNumber } from './StatNumber';

/** CSSProperties extended to allow the `--chip-color` custom property. */
type ChipStyle = CSSProperties & { '--chip-color'?: string };

export interface ConditionChip {
  label: string;
  color: string;
}

export interface InitiativeToken {
  id: string;
  name: string;
  initiative: number;
  type: 'pc' | 'monster';
  /** Real HP, when visible to this client (DM, or PC viewing their own). */
  hp?: number;
  maxHp?: number;
  /** Server-derived label shown instead of hp when it is hidden (§6). */
  statusLabel?: string;
  conditions: ConditionChip[];
}

export interface InitiativeRailProps {
  /** Combatant tokens. Will be displayed sorted by initiative, descending. */
  tokens: InitiativeToken[];
  /** id of the combatant whose turn is active. */
  activeId: string | null;
  className?: string;
}

/**
 * The Initiative Rail (DESIGN_SPEC.md §4) — the signature component.
 * Horizontal scrollable row of combatant tokens ordered by initiative.
 * The active token glows arcane and carries aria-current="true". Each
 * token shows name, HP (or statusLabel for hidden monster HP) and
 * condition chips. The glow animates but honors prefers-reduced-motion
 * (the animation/transition is defined in tokens.css and disabled there
 * under the reduced-motion media query).
 */
export function InitiativeRail({
  tokens,
  activeId,
  className,
}: InitiativeRailProps) {
  const sorted = [...tokens].sort((a, b) => b.initiative - a.initiative);

  return (
    <ol
      className={['initiative-rail', className].filter(Boolean).join(' ')}
      aria-label="Tira de iniciativa"
    >
      {sorted.map((token) => {
        const isActive = token.id === activeId;
        return (
          <li
            key={token.id}
            role="listitem"
            className={[
              'initiative-rail__token',
              isActive ? 'initiative-rail__token--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="initiative-rail__initiative tabular-nums">
              {token.initiative}
            </span>
            <span className="initiative-rail__name">{token.name}</span>
            {token.hp !== undefined ? (
              <StatNumber
                value={token.hp}
                label={`HP de ${token.name}`}
                role={
                  token.maxHp && token.hp <= token.maxHp * 0.25
                    ? 'damage'
                    : undefined
                }
              />
            ) : token.statusLabel ? (
              <span className="initiative-rail__status">
                {token.statusLabel}
              </span>
            ) : null}
            {token.conditions.length > 0 ? (
              <span className="initiative-rail__conditions">
                {token.conditions.map((condition) => (
                  <span
                    key={condition.label}
                    className="condition-chip"
                    style={{ '--chip-color': condition.color } as ChipStyle}
                  >
                    {condition.label}
                  </span>
                ))}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
