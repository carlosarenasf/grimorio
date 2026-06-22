import { useState } from 'react';
import { Button, Field, Panel } from '../../design';
import type { Send, SrdSource } from './types';

export interface BestiaryPanelProps {
  srd: SrdSource;
  send: Send;
}

/**
 * Bestiario SRD panel (LEFT column): a search box filters the curated SRD
 * monster list; the "+" on a row sends AddCombatantFromBestiary (HP hidden by
 * default — the server defaults hpVisibility to dm_only).
 */
export function BestiaryPanel({ srd, send }: BestiaryPanelProps) {
  const [query, setQuery] = useState('');
  const results = srd.searchMonsters(query);

  return (
    <Panel
      eyebrow="SRD 5.2"
      title="Bestiario"
      empty={
        results.length === 0 ? (
          <p className="vm-empty">Sin resultados. Prueba otro nombre.</p>
        ) : undefined
      }
    >
      <div className="vm-bestiary">
        <Field
          label="Buscar en el bestiario"
          placeholder="goblin, orco, dragón…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 ? (
          <ul className="vm-bestiary__list" aria-label="Resultados del bestiario">
            {results.map((m) => (
              <li key={m.id} className="vm-bestiary__row">
                <div className="vm-bestiary__info">
                  <span className="vm-bestiary__name">{m.name}</span>
                  <span className="vm-bestiary__meta eyebrow">
                    {[m.kind, m.cr ? `VD ${m.cr}` : null, m.hp ? `${m.hp} PV` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Añadir ${m.name} al combate`}
                  onClick={() =>
                    send({
                      type: 'AddCombatantFromBestiary',
                      monsterId: m.id,
                      hpVisibility: 'dm_only',
                    })
                  }
                >
                  +
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
