import { useState } from 'react';
import { Button, Field, Panel } from '../../design';
import type { Monster, MonsterSummary, Send, SrdSource } from './types';
import { fiveETools } from '../../srd/links';
import { AddMonsterModal } from './AddMonsterModal';
import { MonsterSheetModal } from './MonsterSheetModal';

export interface BestiaryPanelProps {
  srd: SrdSource;
  send: Send;
  getMonster?: (id: string) => Promise<Monster | null>;
}

/**
 * Bestiario SRD panel (LEFT column): a search box filters the curated SRD
 * monster list; clicking "+" opens a modal to edit stats before adding.
 * Clicking the monster name opens the full stat block.
 */
export function BestiaryPanel({ srd, send, getMonster }: BestiaryPanelProps) {
  const [query, setQuery] = useState('');
  const [addingMonster, setAddingMonster] = useState<MonsterSummary | null>(null);
  const [viewingMonster, setViewingMonster] = useState<Monster | null>(null);
  const [loadingMonster, setLoadingMonster] = useState<string | null>(null);
  const results = srd.searchMonsters(query);

  async function handleViewMonster(id: string) {
    if (!getMonster) return;
    setLoadingMonster(id);
    try {
      const monster = await getMonster(id);
      if (monster) {
        setViewingMonster(monster);
      }
    } finally {
      setLoadingMonster(null);
    }
  }

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
                  <button
                    type="button"
                    className="vm-bestiary__name vm-bestiary__name-btn"
                    onClick={() => handleViewMonster(m.id)}
                    disabled={loadingMonster === m.id}
                  >
                    {loadingMonster === m.id ? 'Cargando…' : m.name}
                  </button>
                  <span className="vm-bestiary__meta eyebrow">
                    {[m.kind, m.cr ? `VD ${m.cr}` : null, m.hp ? `${m.hp} PV` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <div className="vm-bestiary__actions">
                  <a
                    href={fiveETools.monster(m.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vm-bestiary__external"
                    aria-label={`Ver ${m.name} en 5e.tools`}
                    title="Ver en 5e.tools"
                  >
                    ↗
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Añadir ${m.name} al combate`}
                    onClick={() => setAddingMonster(m)}
                  >
                    +
                  </Button>
                </div>
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
          getMonster={getMonster}
        />
      ) : null}

      {viewingMonster ? (
        <MonsterSheetModal
          monster={viewingMonster}
          onClose={() => setViewingMonster(null)}
        />
      ) : null}
    </Panel>
  );
}
