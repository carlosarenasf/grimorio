import { useState } from 'react';
import { Button, Panel } from '../../design';
import type { WeaponDTO } from '../../net/http';
import type { InventoryItem, Send, YouCharacter } from './types';

export interface InventoryPanelProps {
  you: YouCharacter;
  send?: Send;
  /** Weapon catalogue (SRD) for the "Añadir arma" picker. */
  weapons?: WeaponDTO[];
  /** Persisting callbacks (when present, mutations are saved to the sheet). */
  onAddWeapon?: (weapon: WeaponDTO) => void;
  onAddItem?: (name: string) => void;
  onRemoveItem?: (id: string) => void;
  onAdjustItem?: (id: string, delta: number) => void;
}

/**
 * Equipo e inventario: equipped + backpack items, plus "Añadir objeto" and a
 * weapon picker ("Añadir arma") drawn from the SRD catalogue. When persisting
 * callbacks are provided the changes are saved to the character; otherwise the
 * panel falls back to local-only tracking.
 */
export function InventoryPanel({
  you,
  weapons = [],
  onAddWeapon,
  onAddItem,
  onRemoveItem,
  onAdjustItem,
}: InventoryPanelProps) {
  const controlled = Boolean(onRemoveItem || onAdjustItem || onAddItem);
  const [localItems, setLocalItems] = useState<InventoryItem[]>(you.inventory);
  const [newItem, setNewItem] = useState('');
  const [showWeapons, setShowWeapons] = useState(false);
  const [gold, setGold] = useState(you.gold);

  const items = controlled ? you.inventory : localItems;

  function adjustQty(id: string, delta: number) {
    if (onAdjustItem) return onAdjustItem(id, delta);
    setLocalItems((p) =>
      p.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)),
    );
  }
  function remove(id: string) {
    if (onRemoveItem) return onRemoveItem(id);
    setLocalItems((p) => p.filter((i) => i.id !== id));
  }
  function addItem() {
    const name = newItem.trim();
    if (!name) return;
    if (onAddItem) onAddItem(name);
    else
      setLocalItems((p) => [
        ...p,
        { id: `local_${Date.now()}`, name, note: '', qty: 1, equipped: false },
      ]);
    setNewItem('');
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
          <button type="button" className="vj-inventory__step" aria-label={`Disminuir ${item.name}`} onClick={() => adjustQty(item.id, -1)}>−</button>
          <span className="tabular-nums vj-inventory__qty-value">{item.qty}</span>
          <button type="button" className="vj-inventory__step" aria-label={`Aumentar ${item.name}`} onClick={() => adjustQty(item.id, 1)}>+</button>
        </div>
        <Button type="button" variant="ghost" size="sm" aria-label={`Quitar ${item.name}`} onClick={() => remove(item.id)}>Quitar</Button>
      </li>
    );
  }

  return (
    <Panel eyebrow="Equipo" title="Equipo e inventario">
      <div className="vj-inventory">
        <section>
          <h4 className="eyebrow vj-inventory__section-title">Equipado</h4>
          {equipped.length > 0 ? (
            <ul className="vj-inventory__list" aria-label="Equipado">{equipped.map(renderItem)}</ul>
          ) : (
            <p className="vj-empty">Nada equipado todavía.</p>
          )}
        </section>

        <section>
          <h4 className="eyebrow vj-inventory__section-title">Mochila</h4>
          {backpack.length > 0 ? (
            <ul className="vj-inventory__list" aria-label="Mochila">{backpack.map(renderItem)}</ul>
          ) : (
            <p className="vj-empty">La mochila está vacía.</p>
          )}
        </section>

        {/* Add a generic item */}
        <div className="vj-inventory__add">
          <input
            className="field__control"
            placeholder="Añadir objeto…"
            aria-label="Nombre del objeto"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addItem();
            }}
          />
          <Button type="button" variant="secondary" size="sm" disabled={!newItem.trim()} onClick={addItem}>
            Añadir
          </Button>
        </div>

        {/* Add a weapon from the catalogue */}
        {onAddWeapon && weapons.length > 0 ? (
          <div className="vj-weapons">
            <Button type="button" variant="secondary" size="sm" aria-expanded={showWeapons} onClick={() => setShowWeapons((s) => !s)}>
              {showWeapons ? 'Ocultar armas' : '+ Añadir arma'}
            </Button>
            {showWeapons ? (
              <ul className="vj-weapons__list" aria-label="Armas disponibles">
                {weapons.map((w) => (
                  <li key={w.id} className="vj-weapons__row">
                    <div className="vj-weapons__info">
                      <span className="vj-weapons__name">{w.name}</span>
                      <span className="vj-weapons__meta tabular-nums">
                        {w.damage} {w.damageType}
                        {w.properties.length ? ` · ${w.properties.join(', ')}` : ''}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-label={`Equipar ${w.name}`}
                      onClick={() => {
                        onAddWeapon(w);
                        setShowWeapons(false);
                      }}
                    >
                      Equipar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

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
