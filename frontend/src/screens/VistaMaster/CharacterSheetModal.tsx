import { useEffect, useState } from 'react';
import { StatNumber } from '../../design';
import type { ApiClient, CharacterDTO, SpellDTO } from '../../net/http';

export interface CharacterSheetModalProps {
  characterId: string;
  api: ApiClient;
  spellsById: Record<string, SpellDTO>;
  onClose: () => void;
}

const ABILITY_LABEL: Record<string, string> = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};
const SKILL_LABEL: Record<string, string> = {
  acrobatics: 'Acrobacias',
  animal: 'T. con animales',
  arcana: 'Arcanos',
  athletics: 'Atletismo',
  deception: 'Engaño',
  history: 'Historia',
  insight: 'Perspicacia',
  intimidation: 'Intimidación',
  investigation: 'Investigación',
  medicine: 'Medicina',
  nature: 'Naturaleza',
  perception: 'Percepción',
  performance: 'Interpretación',
  persuasion: 'Persuasión',
  sleight: 'Juego de manos',
  stealth: 'Sigilo',
  survival: 'Supervivencia',
};
const mod = (s: number) => Math.floor((s - 10) / 2);
const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const prof = (lvl: number) => Math.ceil(lvl / 4) + 1;

/** Read-only character sheet, opened by the DM from a PC combatant. */
export function CharacterSheetModal({ characterId, api, spellsById, onClose }: CharacterSheetModalProps) {
  const [sheet, setSheet] = useState<CharacterDTO | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getCharacter(characterId)
      .then((s) => !cancelled && setSheet(s))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [api, characterId]);

  return (
    <div className="csm__backdrop" onClick={onClose}>
      <div className="csm" role="dialog" aria-modal="true" aria-label="Ficha de personaje" onClick={(e) => e.stopPropagation()}>
        <header className="csm__head">
          <div>
            <p className="eyebrow">Ficha</p>
            <h2 className="font-display csm__title">{sheet?.name ?? 'Cargando…'}</h2>
            {sheet ? (
              <p className="csm__sub">
                {sheet.species} · {sheet.className} · Nivel {sheet.level}
              </p>
            ) : null}
          </div>
          <button type="button" className="csm__close" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </header>

        {error ? <p className="csm__error" role="alert">No se pudo cargar la ficha.</p> : null}

        {sheet ? (
          <div className="csm__body">
            <div className="csm__combat">
              <div><span className="eyebrow">PV</span><StatNumber value={sheet.currentHp} label="PV" /><span className="csm__hpmax">/{sheet.maxHp}</span></div>
              <div><span className="eyebrow">CA</span><StatNumber value={sheet.armorClass} label="CA" /></div>
              <div><span className="eyebrow">Vel</span><StatNumber value={sheet.speed} label="Velocidad" /></div>
              <div><span className="eyebrow">Comp</span><StatNumber value={prof(sheet.level)} label="Competencia" signed /></div>
              <div><span className="eyebrow">Init</span><StatNumber value={mod(sheet.scores.dex)} label="Iniciativa" signed /></div>
            </div>

            <ul className="csm__abilities">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((k) => (
                <li key={k}>
                  <span className="eyebrow">{ABILITY_LABEL[k]}</span>
                  <strong className="tabular-nums">{sheet.scores[k]}</strong>
                  <span className="csm__mod tabular-nums">{fmt(mod(sheet.scores[k]))}</span>
                </li>
              ))}
            </ul>

            <section className="csm__section">
              <p className="eyebrow">Competencias</p>
              <p className="csm__list">
                {sheet.proficientSkills.length
                  ? sheet.proficientSkills.map((s) => SKILL_LABEL[s] ?? s).join(' · ')
                  : 'Ninguna.'}
              </p>
            </section>

            <section className="csm__section">
              <p className="eyebrow">Ataques</p>
              {sheet.attacks && sheet.attacks.length ? (
                <ul className="csm__items">
                  {sheet.attacks.map((a) => (
                    <li key={a.id}>
                      <span>{a.name}</span>
                      <span className="csm__meta tabular-nums">
                        {a.bonus != null ? `${fmt(a.bonus)} · ` : ''}
                        {a.damage ?? ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="csm__empty">Sin ataques de arma.</p>
              )}
            </section>

            <section className="csm__section">
              <p className="eyebrow">Conjuros</p>
              {sheet.spells && sheet.spells.length ? (
                <ul className="csm__items">
                  {sheet.spells.map((id) => {
                    const sp = spellsById[id];
                    return (
                      <li key={id}>
                        <span>{sp?.name ?? id}</span>
                        <span className="csm__meta">
                          {sp ? `${sp.level === 0 ? 'Truco' : `Nivel ${sp.level}`}${sp.damage ? ` · ${sp.damage}` : ''}` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="csm__empty">Sin conjuros.</p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
