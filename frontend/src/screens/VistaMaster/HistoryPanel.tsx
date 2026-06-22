import { useState } from 'react';
import { Panel, StatNumber } from '../../design';
import type { MasterSnapshot } from './types';

type Tab = 'tiradas' | 'eventos';

export interface HistoryPanelProps {
  snapshot: MasterSnapshot;
}

/**
 * Historial panel (RIGHT column): two tabs. "Tiradas" lists rollLog with each
 * roll's breakdown and total; the master's private (dm_only) rolls are marked
 * "⌧ privada". "Eventos" lists eventLog.
 */
export function HistoryPanel({ snapshot }: HistoryPanelProps) {
  const [tab, setTab] = useState<Tab>('tiradas');
  const { rollLog, eventLog } = snapshot;

  return (
    <Panel eyebrow="Registro" title="Historial">
      <div role="tablist" aria-label="Historial" className="vm-qref__tabs">
        <button
          type="button"
          role="tab"
          id="hist-tab-tiradas"
          aria-selected={tab === 'tiradas'}
          aria-controls="hist-panel-tiradas"
          className={['vm-qref__tab', tab === 'tiradas' ? 'vm-qref__tab--active' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('tiradas')}
        >
          Tiradas
        </button>
        <button
          type="button"
          role="tab"
          id="hist-tab-eventos"
          aria-selected={tab === 'eventos'}
          aria-controls="hist-panel-eventos"
          className={['vm-qref__tab', tab === 'eventos' ? 'vm-qref__tab--active' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => setTab('eventos')}
        >
          Eventos
        </button>
      </div>

      {tab === 'tiradas' ? (
        <div
          role="tabpanel"
          id="hist-panel-tiradas"
          aria-labelledby="hist-tab-tiradas"
        >
          {rollLog.length === 0 ? (
            <p className="vm-empty">Aún no hay tiradas. Lanza los dados para empezar.</p>
          ) : (
            <ul className="vm-history" aria-label="Tiradas">
              {rollLog.map((r) => {
                const isPrivate = r.visibility === 'dm_only';
                return (
                  <li
                    key={r.id}
                    className={[
                      'vm-history__row',
                      isPrivate ? 'vm-history__row--private' : '',
                      `vm-history__row--${r.tone}`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="vm-history__by">{r.byLabel}</span>
                    <span className="vm-history__notation tabular-nums">
                      {r.notation}
                    </span>
                    <span className="vm-history__breakdown">{r.breakdown}</span>
                    <StatNumber
                      value={r.total}
                      label={`Total de ${r.byLabel}`}
                      role={
                        r.tone === 'crit'
                          ? 'active'
                          : r.tone === 'fumble'
                            ? 'damage'
                            : undefined
                      }
                    />
                    {isPrivate ? (
                      <span className="vm-history__private" aria-label="Tirada privada">
                        ⌧ privada
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="hist-panel-eventos"
          aria-labelledby="hist-tab-eventos"
        >
          {eventLog.length === 0 ? (
            <p className="vm-empty">Sin eventos todavía.</p>
          ) : (
            <ul className="vm-history" aria-label="Eventos">
              {eventLog.map((e) => (
                <li
                  key={e.id}
                  className="vm-history__event"
                  style={{ borderLeftColor: e.color }}
                >
                  {e.text}
                  {e.visibility === 'dm_only' ? (
                    <span className="vm-history__private" aria-label="Evento privado">
                      ⌧ privado
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
