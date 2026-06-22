import { useState } from 'react';
import { Panel } from '../../design';

type Tab = 'condiciones' | 'acciones' | 'cds' | 'muerte';

const TABS: { key: Tab; label: string }[] = [
  { key: 'condiciones', label: 'Condiciones' },
  { key: 'acciones', label: 'Acciones' },
  { key: 'cds', label: 'CDs' },
  { key: 'muerte', label: 'Muerte' },
];

const CONDICIONES = [
  'Agarrado', 'Apresado', 'Asustado', 'Aturdido', 'Cegado', 'Derribado',
  'Ensordecido', 'Envenenado', 'Hechizado', 'Incapacitado', 'Inconsciente',
  'Invisible', 'Paralizado', 'Petrificado',
];

const ACCIONES = [
  'Atacar', 'Lanzar un conjuro', 'Esquivar', 'Destrabarse', 'Esprintar',
  'Esconderse', 'Ayudar', 'Aprestar', 'Buscar', 'Usar un objeto',
];

const CDS = [
  ['Muy fácil', '5'], ['Fácil', '10'], ['Moderada', '15'],
  ['Difícil', '20'], ['Muy difícil', '25'], ['Casi imposible', '30'],
];

const MUERTE = [
  'A 0 PV caes inconsciente y empiezas a hacer salvaciones contra muerte.',
  'En tu turno, tira 1d20: 10+ es éxito, 9- es fallo.',
  'Tres éxitos: te estabilizas. Tres fallos: mueres.',
  'Un 1 cuenta como dos fallos; un 20 te recupera con 1 PV.',
  'Recibir daño a 0 PV es un fallo (crítico si es cuerpo a cuerpo): dos fallos.',
];

export interface QuickReferencePanelProps {
  className?: string;
}

/**
 * Referencia rápida panel (LEFT column): tabbed SRD cheatsheet
 * (condiciones / acciones / CDs / muerte). Read-only reference.
 */
export function QuickReferencePanel(_props: QuickReferencePanelProps) {
  const [tab, setTab] = useState<Tab>('condiciones');

  return (
    <Panel eyebrow="SRD 5.2" title="Referencia rápida">
      <div
        role="tablist"
        aria-label="Referencia rápida"
        className="vm-qref__tabs"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`qref-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`qref-panel-${t.key}`}
            className={[
              'vm-qref__tab',
              tab === t.key ? 'vm-qref__tab--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`qref-panel-${tab}`}
        aria-labelledby={`qref-tab-${tab}`}
        className="vm-qref__panel"
      >
        {tab === 'condiciones' ? (
          <ul className="vm-qref__chips">
            {CONDICIONES.map((c) => (
              <li key={c} className="vm-qref__chip">
                {c}
              </li>
            ))}
          </ul>
        ) : null}
        {tab === 'acciones' ? (
          <ul className="vm-qref__chips">
            {ACCIONES.map((a) => (
              <li key={a} className="vm-qref__chip">
                {a}
              </li>
            ))}
          </ul>
        ) : null}
        {tab === 'cds' ? (
          <table className="vm-qref__table">
            <tbody>
              {CDS.map(([label, dc]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="tabular-nums">{dc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {tab === 'muerte' ? (
          <ul className="vm-qref__list">
            {MUERTE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
