import { useState } from 'react';
import type { TileDef, TileCategory } from './tiles';

export interface MapToolbarProps {
  tiles: TileDef[];
  onSelectTile: (tile: TileDef) => void;
}

/**
 * Sidebar izquierdo del editor de mapas: categorías colapsables + buscador.
 *
 * Cada tile es un `<img draggable>` arrastrable al canvas. El buscador filtra
 * por nombre (ignorando mayúsculas) y, al estar activo, expande las categorías
 * que contengan coincidencias para que el resultado sea visible sin clicks extra.
 */
export function MapToolbar({ tiles, onSelectTile }: MapToolbarProps) {
  const [open, setOpen] = useState<Set<TileCategory>>(new Set());
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? tiles.filter((t) => t.name.toLowerCase().includes(q)) : tiles;
  const categories = Array.from(new Set(filtered.map((t) => t.category)));

  function toggle(cat: TileCategory) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, tile: TileDef) {
    e.dataTransfer.setData('application/x-grimorio-tile', tile.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside className="map-toolbar" aria-label="Catálogo de tiles">
      <input
        type="search"
        className="map-toolbar__search"
        placeholder="Buscar tile…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar tile"
      />
      <div className="map-toolbar__categories">
        {categories.map((cat) => {
          const isOpen = Boolean(q) || open.has(cat);
          const catTiles = filtered.filter((t) => t.category === cat);
          return (
            <section key={cat} className="map-toolbar__category">
              <button
                type="button"
                className="map-toolbar__category-header"
                onClick={() => toggle(cat)}
                aria-expanded={isOpen}
              >
                <span className="map-toolbar__chevron">{isOpen ? '▾' : '▸'}</span>
                <span className="map-toolbar__category-name">{cat}</span>
                <span className="map-toolbar__count">{catTiles.length}</span>
              </button>
              {isOpen && catTiles.length > 0 ? (
                <div className="map-tile-grid">
                  {catTiles.map((tile) => (
                    <button
                      key={tile.id}
                      type="button"
                      className="map-tile-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, tile)}
                      onClick={() => onSelectTile(tile)}
                      title={tile.name}
                      aria-label={tile.name}
                    >
                      <img
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(tile.svg)}`}
                        alt={tile.name}
                        width={32}
                        height={32}
                        aria-hidden={false}
                      />
                      <span className="map-tile-item__name">{tile.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
        {categories.length === 0 ? (
          <p className="map-toolbar__empty">Sin resultados.</p>
        ) : null}
      </div>
    </aside>
  );
}