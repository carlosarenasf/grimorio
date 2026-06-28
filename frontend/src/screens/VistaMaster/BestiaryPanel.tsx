import { useState } from 'react';
import { Button, Field, Panel } from '../../design';
import type { MonsterSummary, Send, SrdSource } from './types';
import { AddMonsterModal } from './AddMonsterModal';

export interface BestiaryPanelProps {
  srd: SrdSource;
  send: Send;
}

/**
 * Bestiario SRD panel (LEFT column): a search box filters the curated SRD
 * monster list; clicking "+" opens a modal to edit stats before adding.
 */
export function BestiaryPanel({ srd, send }: BestiaryPanelProps) {
  const [query, setQuery] = useState('');
  const [addingMonster, setAddingMonster] = useState<MonsterSummary | null>(null);
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
                  onClick={() => setAddingMonster(m)}
                >
                  +
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {addingMonster ? (
        <AddMonsterModal
          monster={addingMonster}
          send={send}
          onClose={() => setAddingMonster(null)}
        />
      ) : null}
    </Panel>
  );
}
