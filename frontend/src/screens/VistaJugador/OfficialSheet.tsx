import { useRef, useCallback } from 'react';
import { Button } from '../../design';
import type { YouCharacter } from './types';
import { ABILITY_LABELS, ABILITY_ORDER, abilityMod } from './derived';
import { SKILLS } from './skills';
import './OfficialSheet.css';

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
  const profBonusStr = profBonus >= 0 ? `+${profBonus}` : `${profBonus}`;

  const isSkillProficient = (key: string) => you.proficientSkills.includes(key);

  const equippedItems = you.inventory.filter(i => i.equipped);
  const backpackItems = you.inventory.filter(i => !i.equipped);

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
            {/* Header */}
            <div className="os-header">
              <div className="os-header__name">
                <span className="os-header__name-label">Nombre del personaje</span>
                <span className="os-header__name-value">{you.name}</span>
              </div>
              <div className="os-header__field">
                <span className="os-header__label">Clase y nivel</span>
                <span className="os-header__value">{you.className} {you.level}</span>
              </div>
              <div className="os-header__field">
                <span className="os-header__label">Raza</span>
                <span className="os-header__value">{you.species}</span>
              </div>
              <div className="os-header__field">
                <span className="os-header__label">Trasfondo</span>
                <span className="os-header__value">{you.background}</span>
              </div>
            </div>

            {/* Main Layout */}
            <div className="os-main">
              {/* Left Column */}
              <div className="os-left-col">
                {/* Ability Scores */}
                <div className="os-section">
                  <div className="os-section__header">Puntuaciones de Característica</div>
                  <div className="os-section__body">
                    <div className="os-abilities">
                      {ABILITY_ORDER.map((key) => {
                        const score = you.scores[key];
                        const mod = abilityMod(score);
                        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                        return (
                          <div key={key} className="os-ability">
                            <span className="os-ability__name">{ABILITY_LABELS[key]}</span>
                            <span className="os-ability__score">{score}</span>
                            <span className="os-ability__mod">{modStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Combat Stats */}
                <div className="os-section">
                  <div className="os-section__header">Combate</div>
                  <div className="os-section__body">
                    <div className="os-stats-grid">
                      <div className="os-stat-box">
                        <span className="os-stat-box__value">{you.armorClass}</span>
                        <span className="os-stat-box__label">Clase de Armadura</span>
                      </div>
                      <div className="os-stat-box">
                        <span className="os-stat-box__value">
                          {you.initiative >= 0 ? `+${you.initiative}` : you.initiative}
                        </span>
                        <span className="os-stat-box__label">Iniciativa</span>
                      </div>
                      <div className="os-stat-box">
                        <span className="os-stat-box__value">{you.speed}</span>
                        <span className="os-stat-box__label">Velocidad</span>
                      </div>
                    </div>

                    <div className="os-prof-bonus" style={{ marginTop: '12px' }}>
                      <span>Bonificador de Competencia:</span>
                      <span className="os-prof-bonus__value">{profBonusStr}</span>
                    </div>
                  </div>
                </div>

                {/* Hit Points */}
                <div className="os-section">
                  <div className="os-section__header">Puntos de Golpe</div>
                  <div className="os-section__body">
                    <div className="os-hp">
                      <div className="os-hp__box os-hp__box--current">
                        <span className="os-hp__value">{you.currentHp}</span>
                        <span className="os-hp__label">Actuales</span>
                      </div>
                      <div className="os-hp__box">
                        <span className="os-hp__value">{you.maxHp}</span>
                        <span className="os-hp__label">Máximos</span>
                      </div>
                      <div className="os-hp__box">
                        <span className="os-hp__value">—</span>
                        <span className="os-hp__label">Temporales</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saving Throws */}
                <div className="os-section">
                  <div className="os-section__header">Tiradas de Salvación</div>
                  <div className="os-section__body">
                    <div className="os-proficiencies">
                      {ABILITY_ORDER.map((key) => {
                        const mod = abilityMod(you.scores[key]);
                        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                        return (
                          <div key={key} className="os-prof-row">
                            <span className="os-prof-dot" />
                            <span className="os-prof-name">{ABILITY_LABELS[key]}</span>
                            <span className="os-prof-mod">{modStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="os-section">
                  <div className="os-section__header">Habilidades</div>
                  <div className="os-section__body">
                    <div className="os-proficiencies">
                      {SKILLS.map((skill) => {
                        const mod = abilityMod(you.scores[skill.ability]);
                        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                        const prof = isSkillProficient(skill.key);
                        return (
                          <div key={skill.key} className="os-prof-row">
                            <span className={`os-prof-dot ${prof ? 'os-prof-dot--filled' : ''}`} />
                            <span className="os-prof-name">{skill.name}</span>
                            <span className="os-prof-mod">{prof ? profBonusStr : modStr}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="os-right-col">
                {/* Attacks */}
                <div className="os-section">
                  <div className="os-section__header">Ataques y Conjuros</div>
                  <div className="os-section__body" style={{ padding: 0 }}>
                    <table className="os-attacks-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Bonus</th>
                          <th>Daño</th>
                        </tr>
                      </thead>
                      <tbody>
                        {you.attacks.map((attack) => (
                          <tr key={attack.id}>
                            <td>{attack.name}</td>
                            <td>{attack.bonus !== null ? `+${attack.bonus}` : '—'}</td>
                            <td>{attack.damage ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Equipment */}
                <div className="os-section">
                  <div className="os-section__header">Equipo</div>
                  <div className="os-section__body">
                    <div className="os-equipment-list">
                      {equippedItems.length > 0 && (
                        <>
                          {equippedItems.map((item) => (
                            <div key={item.id} className="os-equipment-item">
                              <span>{item.name} {item.note ? `(${item.note})` : ''}</span>
                              {item.qty > 1 && <span className="os-equipment-qty">x{item.qty}</span>}
                            </div>
                          ))}
                        </>
                      )}
                      {backpackItems.length > 0 && (
                        <>
                          <div style={{ marginTop: '8px', fontSize: '10px', textTransform: 'uppercase', color: '#5c4033', letterSpacing: '0.05em' }}>Mochila</div>
                          {backpackItems.map((item) => (
                            <div key={item.id} className="os-equipment-item">
                              <span>{item.name}</span>
                              {item.qty > 1 && <span className="os-equipment-qty">x{item.qty}</span>}
                            </div>
                          ))}
                        </>
                      )}
                      {you.inventory.length === 0 && (
                        <div style={{ color: '#5c4033', fontStyle: 'italic' }}>Sin equipo</div>
                      )}
                    </div>
                    <div className="os-gold">
                      <span className="os-gold__icon">●</span>
                      <span>{you.gold} mo</span>
                    </div>
                  </div>
                </div>

                {/* Features & Traits */}
                {you.traits.length > 0 && (
                  <div className="os-section">
                    <div className="os-section__header">Rasgos y Características</div>
                    <div className="os-section__body">
                      <div className="os-features-list">
                        {you.traits.map((trait) => (
                          <div key={trait.id} className="os-feature">
                            <div className="os-feature__name">{trait.name}</div>
                            <div className="os-feature__source">{trait.source}</div>
                            {trait.description && (
                              <div className="os-feature__desc">{trait.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Spells */}
                {you.spells.length > 0 && (
                  <div className="os-section">
                    <div className="os-section__header">Conjuros</div>
                    <div className="os-section__body">
                      <div className="os-spells-list">
                        {you.spells.map((spell) => (
                          <div key={spell.id} className="os-spell">
                            <span className="os-spell__name">{spell.name}</span>
                            <span className="os-spell__meta">
                              {spell.level === 0 ? 'Truco' : `N${spell.level}`}
                              {spell.damage ? ` · ${spell.damage}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {you.notes && (
                  <div className="os-section">
                    <div className="os-section__header">Notas</div>
                    <div className="os-section__body">
                      <div className="os-notes">{you.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
