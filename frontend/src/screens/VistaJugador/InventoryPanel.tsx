import { useState } from 'react';
import { Button, Panel } from '../../design';
import type { InventoryItem, Send, YouCharacter } from './types';

export interface InventoryPanelProps {
  you: YouCharacter;
  /** Unused by inventory mutations (local-only) but accepted for symmetry with other panels. */
  send?: Send;
}

/**
 * Equipo e inventario (DESIGN_SPEC.md §5): equipped items + backpack with qty
 * +/- steppers and remove, and gold. Purely LOCAL tracking state seeded from
 * the character sheet — persisting it is out of scope (no command is sent).
 */
export function InventoryPanel({ you }: InventoryPanelProps) {
  const [items, setItems] = useState<InventoryItem[]>(you.inventory);
  const [gold, setGold] = useState(you.gold);

  function adjustQty(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item,
      ),
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const equipped = items.filter((i) => i.equipped);
  const backpack = items.filter((i) => !i.equipped);

  function renderItem(item: InventoryItem) {
    return (
      <li key={item.id} className="vj-inventory__row">
        <div className="vj-inventory__info">
          <span className="vj-inventory__name">{item.name}</span>
          {item.note ? <span className="vj-inventory__note">{item.note}</span> : null}
        </div>
        <div className="vj-inventory__qty" role="group" aria-label={`Cantidad de ${item.name}`}>
          <button
            type="button"
            className="vj-inventory__step"
            aria-label={`Disminuir ${item.name}`}
            onClick={() => adjustQty(item.id, -1)}
          >
            −
          </button>
          <span className="tabular-nums vj-inventory__qty-value">{item.qty}</span>
          <button
            type="button"
            className="vj-inventory__step"
            aria-label={`Aumentar ${item.name}`}
            onClick={() => adjustQty(item.id, 1)}
          >
            +
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Quitar ${item.name}`}
          onClick={() => remove(item.id)}
        >
          Quitar
        </Button>
      </li>
    );
  }

  return (
    <Panel eyebrow="Equipo" title="Equipo e inventario">
      <div className="vj-inventory">
        <section>
          <h4 className="eyebrow vj-inventory__section-title">Equipado</h4>
          {equipped.length > 0 ? (
            <ul className="vj-inventory__list" aria-label="Equipado">
              {equipped.map(renderItem)}
            </ul>
          ) : (
            <p className="vj-empty">Nada equipado todavía.</p>
          )}
        </section>

        <section>
          <h4 className="eyebrow vj-inventory__section-title">Mochila</h4>
          {backpack.length > 0 ? (
            <ul className="vj-inventory__list" aria-label="Mochila">
              {backpack.map(renderItem)}
            </ul>
          ) : (
            <p className="vj-empty">La mochila está vacía.</p>
          )}
        </section>

        <div className="vj-inventory__gold">
          <span className="eyebrow">Oro</span>
          <input
            type="number"
            className="field__control tabular-nums vj-inventory__gold-input"
            aria-label="Oro"
            min={0}
            value={gold}
            onChange={(e) => setGold(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>
    </Panel>
  );
}
