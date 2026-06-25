import { Button, Panel } from '../../design';

export interface PlayerCharacterRef {
  id: string;
  name: string;
}

export interface PlayersPanelProps {
  /** Characters in the campaign (from GET /campaigns/:id/characters). */
  characters: PlayerCharacterRef[];
  /** CharacterIds currently seated in the battle (a PC combatant exists for them). */
  seatedCharacterIds: string[];
  /** Seat a character into the battle (DM decides who's in). */
  onSeat: (characterId: string) => void;
}

/**
 * "Jugadores": the DM decides who is in the battle. Lists the campaign's
 * characters; one that isn't seated yet can be added with one click. To take a
 * character out, use the ✕ on its row in the Combatientes panel.
 */
export function PlayersPanel({ characters, seatedCharacterIds, onSeat }: PlayersPanelProps) {
  const seated = new Set(seatedCharacterIds);
  return (
    <Panel
      eyebrow="Mesa"
      title="Jugadores"
      empty={
        characters.length === 0 ? (
          <p className="vm-empty">Aún no hay personajes en la campaña.</p>
        ) : undefined
      }
    >
      {characters.length > 0 ? (
        <ul className="vm-players" aria-label="Personajes de la campaña">
          {characters.map((c) => {
            const isSeated = seated.has(c.id);
            return (
              <li key={c.id} className="vm-players__row">
                <span className="vm-players__name">{c.name}</span>
                {isSeated ? (
                  <span className="vm-players__in eyebrow">En combate</span>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Añadir ${c.name} al combate`}
                    onClick={() => onSeat(c.id)}
                  >
                    Añadir
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}
