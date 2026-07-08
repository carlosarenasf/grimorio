import { useRef, useCallback } from 'react';
import { Button } from '../../design';
import type { AbilityKey, YouCharacter } from './types';
import { ABILITY_LABELS, ABILITY_ORDER, abilityMod } from './derived';
import { SKILLS } from './skills';
import './OfficialSheet.css';

const ABILITY_ABBR: Record<AbilityKey, string> = {
  str: 'Fue',
  dex: 'Des',
  con: 'Con',
  int: 'Int',
  wis: 'Sab',
  cha: 'Car',
};

const SKILL_DISPLAY: Record<string, string> = {
  athletics: 'Atletismo',
  acrobatics: 'Acrobacias',
  sleight_of_hand: 'Juego de Manos',
  stealth: 'Sigilo',
  arcana: 'C. Arcano',
  history: 'Historia',
  investigation: 'Investigación',
  nature: 'Naturaleza',
  religion: 'Religión',
  animal_handling: 'T. con Animales',
  insight: 'Perspicacia',
  medicine: 'Medicina',
  perception: 'Percepción',
  survival: 'Supervivencia',
  deception: 'Engaño',
  intimidation: 'Intimidación',
  performance: 'Interpretación',
  persuasion: 'Persuasión',
};

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface OfficialSheetProps {
  you: YouCharacter;
  onClose: () => void;
}

export function OfficialSheet({ you, onClose }: OfficialSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!sheetRef.current) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(sheetRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f4edd3',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`${you.name}_ficha.pdf`);
  }, [you.name]);

  const profBonus = you.proficiencyBonus;
  const profStr = fmtMod(profBonus);

  const isSkillProficient = (key: string) => you.proficientSkills.includes(key);

  const passiveWisdom = 10 + abilityMod(you.scores.wis) +
    (isSkillProficient('perception') ? profBonus : 0);

  const equippedItems = you.inventory.filter(i => i.equipped);
  const backpackItems = you.inventory.filter(i => !i.equipped);

  const groupedTraits = {
    species: you.traits.filter(t => t.source === 'species'),
    class: you.traits.filter(t => t.source === 'class'),
    background: you.traits.filter(t => t.source === 'background'),
    other: you.traits.filter(t => t.source === 'other'),
  };

  const cantrips = you.spells.filter(s => s.level === 0);
  const leveledSpells = you.spells.filter(s => s.level > 0);
  const spellsByLevel = Array.from({ length: 9 }, (_, i) => ({
    level: i + 1,
    spells: leveledSpells.filter(s => s.level === i + 1),
  })).filter(g => g.spells.length > 0);

  return (
    <div className="os-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="os-modal">
        <div className="os-modal__head">
          <h2 className="os-modal__title">Ficha de Personaje</h2>
          <div className="os-modal__actions">
            <Button variant="secondary" size="sm" onClick={handleExportPDF}>
              Exportar PDF
            </Button>
            <button type="button" className="os-modal__close" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>
        <div className="os-modal__body">
          <div className="os-sheet" ref={sheetRef}>

            {/* ===== PAGE 1: Main Character Sheet ===== */}
            <div className="os-page">

              {/* --- Header row --- */}
              <div className="os-header">
                <div className="os-header__name">
                  <span className="os-header__label">Nombre del personaje</span>
                  <span className="os-header__value os-header__value--name">{you.name}</span>
                </div>
                <div className="os-header__field">
                  <span className="os-header__label">Clase y nivel</span>
                  <span className="os-header__value">{you.className} {you.level}</span>
                </div>
                <div className="os-header__field">
                  <span className="os-header__label">Trasfondo</span>
                  <span className="os-header__value">{you.background}</span>
                </div>
                <div className="os-header__field">
                  <span className="os-header__label">Raza</span>
                  <span className="os-header__value">{you.species}</span>
                </div>
                <div className="os-header__field">
                  <span className="os-header__label">Alineamiento</span>
                  <span className="os-header__value os-header__value--blank" />
                </div>
                <div className="os-header__field">
                  <span className="os-header__label">Puntos de experiencia</span>
                  <span className="os-header__value os-header__value--blank" />
                </div>
              </div>

              {/* --- Three-column body --- */}
              <div className="os-body">

                {/* ===== LEFT COLUMN ===== */}
                <div className="os-col os-col--left">

                  {/* Proficiency bonus */}
                  <div className="os-prof-bonus">
                    <div className="os-prof-bonus__box">
                      <span className="os-prof-bonus__value">{profStr}</span>
                    </div>
                    <span className="os-prof-bonus__label">Bonificador por competencia</span>
                  </div>

                  {/* Saving throws */}
                  <div className="os-block">
                    <div className="os-block__title">Tiradas de salvación</div>
                    <div className="os-block__body">
                      {ABILITY_ORDER.map((key) => {
                        const mod = abilityMod(you.scores[key]);
                        return (
                          <div key={key} className="os-check-row">
                            <span className="os-bubble" />
                            <span className="os-check-row__label">{ABILITY_LABELS[key]}</span>
                            <span className="os-check-row__mod">{fmtMod(mod)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspiration */}
                  <div className="os-inspiration">
                    <span className="os-inspiration__label">Inspiración</span>
                  </div>

                  {/* Skills */}
                  <div className="os-block os-block--flex">
                    <div className="os-block__title">Habilidades</div>
                    <div className="os-block__body">
                      {SKILLS.map((skill) => {
                        const mod = abilityMod(you.scores[skill.ability]);
                        const prof = isSkillProficient(skill.key);
                        const total = mod + (prof ? profBonus : 0);
                        return (
                          <div key={skill.key} className="os-check-row os-check-row--skill">
                            <span className={`os-bubble ${prof ? 'os-bubble--filled' : ''}`} />
                            <span className="os-check-row__label">
                              {SKILL_DISPLAY[skill.key] ?? skill.name}
                              <span className="os-check-row__abbr"> ({ABILITY_ABBR[skill.ability]})</span>
                            </span>
                            <span className="os-check-row__mod">{fmtMod(total)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ===== CENTER COLUMN ===== */}
                <div className="os-col os-col--center">

                  {/* AC / Initiative / Speed */}
                  <div className="os-combat-row">
                    <div className="os-hex">
                      <span className="os-hex__value">{you.armorClass}</span>
                      <span className="os-hex__label">Clase de armadura</span>
                    </div>
                    <div className="os-diamond">
                      <span className="os-diamond__value">{fmtMod(you.initiative)}</span>
                      <span className="os-diamond__label">Iniciativa</span>
                    </div>
                    <div className="os-hex">
                      <span className="os-hex__value">{you.speed}</span>
                      <span className="os-hex__label">Velocidad</span>
                    </div>
                  </div>

                  {/* Hit dice & max HP */}
                  <div className="os-hp-row os-hp-row--top">
                    <div className="os-hp-box os-hp-box--small">
                      <span className="os-hp-box__label">Dados de golpe</span>
                      <span className="os-hp-box__value os-hp-box__value--blank">—</span>
                    </div>
                    <div className="os-hp-box os-hp-box--small">
                      <span className="os-hp-box__label">Puntos de golpe máximos</span>
                      <span className="os-hp-box__value">{you.maxHp}</span>
                    </div>
                  </div>

                  {/* Current HP */}
                  <div className="os-hp-box os-hp-box--current">
                    <span className="os-hp-box__label">Puntos de golpe actuales</span>
                    <span className="os-hp-box__value os-hp-box__value--big">{you.currentHp}</span>
                  </div>

                  {/* Temp HP */}
                  <div className="os-hp-box os-hp-box--small">
                    <span className="os-hp-box__label">Puntos de golpe temporales</span>
                    <span className="os-hp-box__value os-hp-box__value--blank">—</span>
                  </div>

                  {/* Death saves */}
                  <div className="os-death-saves">
                    <div className="os-death-saves__title">Salvaciones contra muerte</div>
                    <div className="os-death-saves__row">
                      <span className="os-death-saves__label">Éxitos</span>
                      <span className="os-death-circle" />
                      <span className="os-death-circle" />
                      <span className="os-death-circle" />
                    </div>
                    <div className="os-death-saves__row">
                      <span className="os-death-saves__label">Fallos</span>
                      <span className="os-death-circle" />
                      <span className="os-death-circle" />
                      <span className="os-death-circle" />
                    </div>
                  </div>
                </div>

                {/* ===== RIGHT COLUMN ===== */}
                <div className="os-col os-col--right">

                  {/* Passive perception */}
                  <div className="os-passive">
                    <span className="os-passive__value">{passiveWisdom}</span>
                    <span className="os-passive__label">Sabiduría (percepción) pasiva</span>
                  </div>

                  {/* Other proficiencies & languages */}
                  <div className="os-block os-block--grow">
                    <div className="os-block__title">Otras competencias e idiomas</div>
                    <div className="os-block__body os-block__body--text">
                      {groupedTraits.species.length > 0 && (
                        <p className="os-text-line">
                          <span className="os-text-cat">Raza:</span>{' '}
                          {groupedTraits.species.map(t => t.name).join(', ')}
                        </p>
                      )}
                      {groupedTraits.class.length > 0 && (
                        <p className="os-text-line">
                          <span className="os-text-cat">Clase:</span>{' '}
                          {groupedTraits.class.map(t => t.name).join(', ')}
                        </p>
                      )}
                      {groupedTraits.background.length > 0 && (
                        <p className="os-text-line">
                          <span className="os-text-cat">Trasfondo:</span>{' '}
                          {groupedTraits.background.map(t => t.name).join(', ')}
                        </p>
                      )}
                      {groupedTraits.other.length > 0 && (
                        <p className="os-text-line">
                          <span className="os-text-cat">Otros:</span>{' '}
                          {groupedTraits.other.map(t => t.name).join(', ')}
                        </p>
                      )}
                      {you.traits.length === 0 && (
                        <p className="os-text-line os-text-line--empty">—</p>
                      )}
                    </div>
                  </div>

                  {/* Attacks & spellcasting */}
                  <div className="os-block">
                    <div className="os-block__title">Ataques y lanzamiento de conjuros</div>
                    <div className="os-block__body" style={{ padding: 0 }}>
                      <table className="os-attacks">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th className="os-attacks__bonus">Bonif.</th>
                            <th>Daño/Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {you.attacks.map((atk) => (
                            <tr key={atk.id}>
                              <td>{atk.name}</td>
                              <td className="os-attacks__bonus">
                                {atk.bonus !== null ? fmtMod(atk.bonus) : '—'}
                              </td>
                              <td>
                                {atk.damage ?? '—'}
                                {atk.damageType ? ` ${atk.damageType}` : ''}
                              </td>
                            </tr>
                          ))}
                          {you.attacks.length === 0 && (
                            <tr><td colSpan={3} className="os-attacks__empty">—</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="os-block os-block--grow">
                    <div className="os-block__title">Equipo</div>
                    <div className="os-block__body os-block__body--text">
                      <div className="os-equip-list">
                        {equippedItems.map(item => (
                          <div key={item.id} className="os-equip-item">
                            <span>{item.name}</span>
                            {item.qty > 1 && <span className="os-equip-qty">×{item.qty}</span>}
                          </div>
                        ))}
                        {backpackItems.length > 0 && equippedItems.length > 0 && (
                          <div className="os-equip-sep" />
                        )}
                        {backpackItems.map(item => (
                          <div key={item.id} className="os-equip-item">
                            <span>{item.name}</span>
                            {item.qty > 1 && <span className="os-equip-qty">×{item.qty}</span>}
                          </div>
                        ))}
                        {you.inventory.length === 0 && (
                          <p className="os-text-line os-text-line--empty">—</p>
                        )}
                      </div>
                      <div className="os-money">
                        <div className="os-money__coin">
                          <span className="os-money__label">PC</span>
                          <span className="os-money__value">0</span>
                        </div>
                        <div className="os-money__coin">
                          <span className="os-money__label">PP</span>
                          <span className="os-money__value">0</span>
                        </div>
                        <div className="os-money__coin">
                          <span className="os-money__label">PE</span>
                          <span className="os-money__value">0</span>
                        </div>
                        <div className="os-money__coin">
                          <span className="os-money__label">PO</span>
                          <span className="os-money__value">{you.gold}</span>
                        </div>
                        <div className="os-money__coin">
                          <span className="os-money__label">PPT</span>
                          <span className="os-money__value">0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features & traits */}
                  <div className="os-block os-block--grow">
                    <div className="os-block__title">Rasgos y atributos</div>
                    <div className="os-block__body os-block__body--text">
                      {you.traits.map(trait => (
                        <div key={trait.id} className="os-trait">
                          <span className="os-trait__name">{trait.name}</span>
                          {trait.description && (
                            <span className="os-trait__desc"> — {trait.description}</span>
                          )}
                        </div>
                      ))}
                      {you.traits.length === 0 && (
                        <p className="os-text-line os-text-line--empty">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Footer row --- */}
              <div className="os-footer">
                <div className="os-footer__top">
                  <div className="os-footer-block os-footer-block--wide">
                    <div className="os-footer-block__title">Rasgos de personalidad</div>
                    <div className="os-footer-block__body os-footer-block__body--text" />
                  </div>
                  <div className="os-footer-block">
                    <div className="os-footer-block__title">Ideales</div>
                    <div className="os-footer-block__body os-footer-block__body--text" />
                  </div>
                </div>
                <div className="os-footer__bottom">
                  <div className="os-footer-block">
                    <div className="os-footer-block__title">Vínculos</div>
                    <div className="os-footer-block__body os-footer-block__body--text" />
                  </div>
                  <div className="os-footer-block">
                    <div className="os-footer-block__title">Defectos</div>
                    <div className="os-footer-block__body os-footer-block__body--text" />
                  </div>
                  {/* Ability scores */}
                  <div className="os-abilities">
                    {ABILITY_ORDER.map((key) => {
                      const score = you.scores[key];
                      const mod = abilityMod(score);
                      return (
                        <div key={key} className="os-ability-hex">
                          <div className="os-ability-hex__shape">
                            <span className="os-ability-hex__name">{ABILITY_ABBR[key]}</span>
                            <span className="os-ability-hex__score">{score}</span>
                            <span className="os-ability-hex__mod">{fmtMod(mod)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>{/* /page 1 */}

            {/* ===== PAGE 2: Spellcasting ===== */}
            {you.hasSpellcasting && (
              <div className="os-page os-page--break">

                {/* Spellcasting header */}
                <div className="os-spell-header">
                  <div className="os-spell-header__name">
                    <span className="os-header__label">Nombre del personaje</span>
                    <span className="os-header__value">{you.name}</span>
                  </div>
                  <div className="os-spell-cells">
                    <div className="os-spell-cell">
                      <span className="os-spell-cell__label">Clase lanzadora de conjuros</span>
                      <span className="os-spell-cell__value">{you.className}</span>
                    </div>
                    <div className="os-spell-cell">
                      <span className="os-spell-cell__label">Aptitud mágica</span>
                      <span className="os-spell-cell__value os-spell-cell__value--blank">—</span>
                    </div>
                    <div className="os-spell-cell">
                      <span className="os-spell-cell__label">CD de salvación de conjuros</span>
                      <span className="os-spell-cell__value os-spell-cell__value--blank">—</span>
                    </div>
                    <div className="os-spell-cell">
                      <span className="os-spell-cell__label">Bonif. de ataque de conjuros</span>
                      <span className="os-spell-cell__value os-spell-cell__value--blank">—</span>
                    </div>
                  </div>
                </div>

                {/* Cantrips */}
                <div className="os-block">
                  <div className="os-block__title">Trucos</div>
                  <div className="os-block__body os-block__body--text">
                    {cantrips.length > 0 ? (
                      <div className="os-spell-list">
                        {cantrips.map(spell => (
                          <span key={spell.id} className="os-spell-item">{spell.name}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="os-text-line os-text-line--empty">—</p>
                    )}
                  </div>
                </div>

                {/* Spell slots table */}
                {spellsByLevel.length > 0 && (
                  <div className="os-block">
                    <div className="os-block__title">Conjuros conocidos</div>
                    <div className="os-block__body" style={{ padding: 0 }}>
                      <table className="os-spell-table">
                        <thead>
                          <tr>
                            <th>Nivel</th>
                            <th className="os-spell-table__slots">Espacios totales</th>
                            <th className="os-spell-table__slots">Espacios gastados</th>
                            <th>Conjuros</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spellsByLevel.map(({ level, spells }) => (
                            <tr key={level}>
                              <td className="os-spell-table__level">{level}</td>
                              <td className="os-spell-table__slots">—</td>
                              <td className="os-spell-table__slots">—</td>
                              <td>
                                <div className="os-spell-list os-spell-list--compact">
                                  {spells.map(spell => (
                                    <span key={spell.id} className="os-spell-item">
                                      {spell.name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
