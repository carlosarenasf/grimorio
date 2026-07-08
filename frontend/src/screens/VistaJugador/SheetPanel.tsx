import { useState } from 'react';
import { Button, DiceModal, Panel, StatNumber } from '../../design';
import type { DiceRollView } from '../../design';
import type { SpellDTO } from '../../net/http';
import { ABILITY_LABELS, ABILITY_ORDER, abilityMod, allModifiers } from './derived';
import { SKILLS } from './skills';
import { TraitsPanel } from './TraitsPanel';
import { AddSpellModal } from './AddSpellModal';
import { AddAttackModal } from './AddAttackModal';
import type { NewAttackData } from './AddAttackModal';
import type { Send, YouCharacter } from './types';

export interface SheetPanelProps {
  you: YouCharacter;
  /** Lets the player heal or damage their OWN character (any time). */
  send?: Send;
  /** Latest public roll from the snapshot — drives the dice animation. */
  latestRoll?: DiceRollView | null;
  /** Callback to add a spell to the character sheet. */
  onAddSpell?: (spell: SpellDTO) => void;
  /** Callback to remove a spell from the character sheet. */
  onRemoveSpell?: (spellId: string) => void;
  /** Callback to add a custom attack to the character sheet. */
  onAddAttack?: (attack: NewAttackData) => void;
  /** Callback to remove an attack from the character sheet. */
  onRemoveAttack?: (attackId: string) => void;
  /** Fetch spells from the SRD for the add-spell modal. */
  fetchSpells?: (classId?: string) => Promise<SpellDTO[]>;
  /** Opens the edit-sheet modal. */
  onEditSheet?: () => void;
  /** Opens the official D&D-style sheet view. */
  onOfficialSheet?: () => void;
}

/**
 * TU FICHA (DESIGN_SPEC.md §5): HP bar, the 6 ability modifiers, skills list,
 * and the CA/Vel/Comp/Init quartet. Read-only here — HP changes arrive via the
 * server snapshot, this panel only renders the viewer's own character.
 */
export function SheetPanel({
  you,
  send,
  latestRoll,
  onAddSpell,
  onRemoveSpell,
  onAddAttack,
  onRemoveAttack,
  fetchSpells,
  onEditSheet,
  onOfficialSheet,
}: SheetPanelProps) {
  const mods = allModifiers(you.scores);
  const hpRatio = you.maxHp > 0 ? you.currentHp / you.maxHp : 1;
  const hpRole = hpRatio <= 0.25 ? 'damage' : undefined;
  const [amount, setAmount] = useState('1');
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const canAdjust = Boolean(send && you.combatantId);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillModifier, setSkillModifier] = useState(0);
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [spellsExpanded, setSpellsExpanded] = useState(false);
  const [attacksExpanded, setAttacksExpanded] = useState(false);
  const [addSpellOpen, setAddSpellOpen] = useState(false);
  const [addAttackOpen, setAddAttackOpen] = useState(false);

  function rollSkill(modifier: number) {
    setSkillModifier(modifier);
    setSkillModalOpen(true);
  }

  function handleSkillRoll(notation: string) {
    if (send) {
      send({ type: 'RollDice', notation, visibility: 'public' });
    }
  }

  return (
    <>
    <Panel
      eyebrow="Tu ficha"
      title={you.name}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {onOfficialSheet ? (
            <Button type="button" variant="secondary" size="sm" onClick={onOfficialSheet}>
              Ficha oficial
            </Button>
          ) : null}
          {onEditSheet ? (
            <Button type="button" variant="secondary" size="sm" onClick={onEditSheet}>
              Editar ficha
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="vj-sheet">
        <div className="vj-sheet__hp">
          <StatNumber
            className="vj-sheet__hp-current"
            value={you.currentHp}
            label={`PV actuales de ${you.name}`}
            role={hpRole}
          />
          <span className="vj-sheet__hp-max tabular-nums">/ {you.maxHp} PV</span>
          <div
            className="vj-sheet__hp-bar"
            role="progressbar"
            aria-label="Barra de PV"
            aria-valuemin={0}
            aria-valuemax={you.maxHp}
            aria-valuenow={you.currentHp}
          >
            <div
              className={[
                'vj-sheet__hp-bar-fill',
                hpRole ? 'vj-sheet__hp-bar-fill--damage' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ width: `${Math.max(0, Math.min(1, hpRatio)) * 100}%` }}
            />
          </div>
          {canAdjust ? (
            <div className="vj-sheet__hpctl" role="group" aria-label="Ajustar tus PV">
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Cantidad de PV"
                className="vj-sheet__hpctl-amount"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={amt <= 0}
                onClick={() =>
                  send!({ type: 'ApplyHealing', combatantId: you.combatantId!, amount: amt })
                }
              >
                Curarme
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={amt <= 0}
                onClick={() =>
                  send!({ type: 'ApplyDamage', combatantId: you.combatantId!, amount: amt })
                }
              >
                Daño
              </Button>
            </div>
          ) : null}
        </div>

        <ul className="vj-sheet__mods" aria-label="Modificadores de característica">
          {ABILITY_ORDER.map((key) => (
            <li key={key} className="vj-sheet__mod">
              <span className="eyebrow vj-sheet__mod-label">{ABILITY_LABELS[key]}</span>
              <StatNumber value={mods[key]} label={`Mod ${ABILITY_LABELS[key]}`} signed />
            </li>
          ))}
        </ul>

        <div className="vj-sheet__skills">
          <button
            type="button"
            className="vj-sheet__skills-header"
            onClick={() => setSkillsExpanded(!skillsExpanded)}
            aria-expanded={skillsExpanded}
          >
            <h3 className="eyebrow vj-sheet__skills-title">Habilidades</h3>
            <span className="vj-sheet__skills-toggle">{skillsExpanded ? '▼' : '▶'}</span>
          </button>
          {skillsExpanded ? (
            <ul className="vj-sheet__skills-list" aria-label="Habilidades">
              {SKILLS.map((skill) => {
                const mod = abilityMod(you.scores[skill.ability]);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                return (
                  <li key={skill.key} className="vj-sheet__skill">
                    <span className="vj-sheet__skill-name">{skill.name}</span>
                    <span className="vj-sheet__skill-mod tabular-nums">{modStr}</span>
                    {send ? (
                      <button
                        type="button"
                        className="vj-sheet__skill-roll"
                        aria-label={`Tirar ${skill.name}`}
                        onClick={() => rollSkill(mod)}
                      >
                        🎲
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {send ? (
          <DiceModal
            open={skillModalOpen}
            onClose={() => setSkillModalOpen(false)}
            onRoll={handleSkillRoll}
            latestRoll={latestRoll}
            initialModifier={skillModifier}
          />
        ) : null}

        <dl className="vj-sheet__stats">
          <div className="vj-sheet__stat">
            <dt className="eyebrow">CA</dt>
            <dd>
              <StatNumber value={you.armorClass} label="CA" />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Velocidad</dt>
            <dd>
              <StatNumber value={you.speed} label="Velocidad" />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Competencia</dt>
            <dd>
              <StatNumber value={you.proficiencyBonus} label="Competencia" signed />
            </dd>
          </div>
          <div className="vj-sheet__stat">
            <dt className="eyebrow">Iniciativa</dt>
            <dd>
              <StatNumber value={you.initiative} label="Iniciativa" signed />
            </dd>
          </div>
        </dl>

        {you.spells.length > 0 || you.hasSpellcasting ? (
          <div className="vj-sheet__spells">
            <div className="vj-sheet__section-header">
              <h3 className="eyebrow vj-sheet__section-title">Conjuros</h3>
              {onAddSpell && you.hasSpellcasting ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAddSpellOpen(true)}
                >
                  + Añadir conjuro
                </Button>
              ) : null}
            </div>
            {you.spells.length > 0 ? (
              <button
                type="button"
                className="vj-sheet__skills-header"
                onClick={() => setSpellsExpanded(!spellsExpanded)}
                aria-expanded={spellsExpanded}
              >
                <span className="vj-sheet__skills-toggle">{spellsExpanded ? '▼' : '▶'}</span>
                <span className="eyebrow">{you.spells.length} conjuro{you.spells.length !== 1 ? 's' : ''}</span>
              </button>
            ) : (
              <p className="vj-empty">No tienes conjuros preparados.</p>
            )}
            {spellsExpanded && you.spells.length > 0 ? (
              <ul className="vj-sheet__spell-list" aria-label="Conjuros">
                {you.spells.map((spell) => (
                  <li key={spell.id} className="vj-sheet__spell-row">
                    <div className="vj-sheet__spell-info">
                      <span className="vj-sheet__spell-name">{spell.name}</span>
                      <span className="vj-sheet__spell-meta">
                        {spell.level === 0 ? 'Truco' : `Nivel ${spell.level}`} · {spell.school}
                        {spell.damage ? ` · ${spell.damage}` : ''}
                      </span>
                    </div>
                    {onRemoveSpell ? (
                      <button
                        type="button"
                        className="vj-sheet__remove-btn"
                        aria-label={`Quitar ${spell.name}`}
                        onClick={() => onRemoveSpell(spell.id)}
                      >
                        ✕
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="vj-sheet__attacks">
          <div className="vj-sheet__section-header">
            <h3 className="eyebrow vj-sheet__section-title">Ataques</h3>
            {onAddAttack ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAddAttackOpen(true)}
              >
                + Añadir ataque
              </Button>
            ) : null}
          </div>
          {you.attacks.length > 0 ? (
            <button
              type="button"
              className="vj-sheet__skills-header"
              onClick={() => setAttacksExpanded(!attacksExpanded)}
              aria-expanded={attacksExpanded}
            >
              <span className="vj-sheet__skills-toggle">{attacksExpanded ? '▼' : '▶'}</span>
              <span className="eyebrow">{you.attacks.length} ataque{you.attacks.length !== 1 ? 's' : ''}</span>
            </button>
          ) : (
            <p className="vj-empty">No tienes ataques.</p>
          )}
          {attacksExpanded && you.attacks.length > 0 ? (
            <ul className="vj-sheet__attack-list" aria-label="Ataques">
              {you.attacks.map((attack) => (
                <li key={attack.id} className="vj-sheet__attack-row">
                  <div className="vj-sheet__attack-info">
                    <span className="vj-sheet__attack-name">{attack.name}</span>
                    <span className="vj-sheet__attack-meta tabular-nums">
                      {attack.bonus !== null ? `+${attack.bonus}` : '—'}
                      {attack.damage ? ` · ${attack.damage}` : ''}
                    </span>
                  </div>
                  {onRemoveAttack && attack.id !== 'basic-unarmed' ? (
                    <button
                      type="button"
                      className="vj-sheet__remove-btn"
                      aria-label={`Quitar ${attack.name}`}
                      onClick={() => onRemoveAttack(attack.id)}
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {onAddSpell && fetchSpells ? (
          <AddSpellModal
            open={addSpellOpen}
            onClose={() => setAddSpellOpen(false)}
            onAdd={(spell) => onAddSpell(spell)}
            fetchSpells={fetchSpells}
            className={you.className}
            existingSpellIds={you.spells.map((s) => s.id)}
          />
        ) : null}

        {onAddAttack ? (
          <AddAttackModal
            open={addAttackOpen}
            onClose={() => setAddAttackOpen(false)}
            onAdd={(attack) => onAddAttack(attack)}
          />
        ) : null}
      </div>
    </Panel>
    {you.traits.length > 0 ? <TraitsPanel traits={you.traits} /> : null}
    </>
  );
}
