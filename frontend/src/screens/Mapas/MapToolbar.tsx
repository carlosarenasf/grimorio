import { useState } from 'react';
import type { TileDef, TileCategory } from './tiles';
import type { FACatalog, FATileDef } from './fa-tiles';

export interface MapToolbarProps {
  tiles: TileDef[];
  faCatalog?: FACatalog | null;
  selectedTileId?: string | null;
  onSelectSvgTile: (tile: TileDef) => void;
  onSelectFATile: (tile: FATileDef) => void;
}

type Source = 'svg' | 'fa';

/**
 * Sidebar izquierdo del editor de mapas: categorías colapsables + buscador.
 *
 * Soporta dos fuentes de tiles:
 *  - **SVG** (catálogo local inline): los tiles de siempre, renderizados como
 *    `<img>` con data URL SVG.
 *  - **FA** (Forgotten Adventures): imágenes PNG servidas desde `/fa-assets/`,
 *    organizadas por las categorías del pack original.
 *
 * Un toggle en la parte superior permite cambiar entre fuentes. El buscador
 * filtra por nombre dentro de la fuente activa.
 */
export function MapToolbar({
  tiles,
  faCatalog,
  selectedTileId,
  onSelectSvgTile,
  onSelectFATile,
}: MapToolbarProps) {
  const [source, setSource] = useState<Source>('svg');
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const [openFACats, setOpenFACats] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  function toggleSvgCat(cat: TileCategory) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleFACat(catId: string) {
    setOpenFACats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function handleSvgDragStart(e: React.DragEvent, tile: TileDef) {
    e.dataTransfer.setData('application/x-grimorio-tile', tile.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handleFADragStart(e: React.DragEvent, tile: FATileDef) {
    e.dataTransfer.setData('application/x-grimorio-tile', tile.id);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside className="map-toolbar" aria-label="Catálogo de tiles">
      <div className="map-toolbar__source-toggle" role="tablist" aria-label="Fuente de tiles">
        <button
          type="button"
          role="tab"
          aria-selected={source === 'svg'}
          className={`map-toolbar__source-btn${source === 'svg' ? ' map-toolbar__source-btn--active' : ''}`}
          onClick={() => setSource('svg')}
        >
          SVG
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === 'fa'}
          className={`map-toolbar__source-btn${source === 'fa' ? ' map-toolbar__source-btn--active' : ''}`}
          onClick={() => setSource('fa')}
          disabled={!faCatalog}
        >
          FA Assets
        </button>
      </div>
      <input
        type="search"
        className="map-toolbar__search"
        placeholder={source === 'svg' ? 'Buscar tile…' : 'Buscar asset FA…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar tile"
      />
      <div className="map-toolbar__categories">
        {source === 'svg' ? (
          <SvgTileList
            tiles={tiles}
            query={q}
            openCats={openCats}
            selectedTileId={selectedTileId}
            onToggle={toggleSvgCat}
            onDragStart={handleSvgDragStart}
            onSelect={onSelectSvgTile}
          />
        ) : (
          <FATileList
            catalog={faCatalog}
            query={q}
            openCats={openFACats}
            selectedTileId={selectedTileId}
            onToggle={toggleFACat}
            onDragStart={handleFADragStart}
            onSelect={onSelectFATile}
          />
        )}
      </div>
    </aside>
  );
}

function SvgTileList(props: {
  tiles: TileDef[];
  query: string;
  openCats: Set<string>;
  selectedTileId?: string | null;
  onToggle: (cat: TileCategory) => void;
  onDragStart: (e: React.DragEvent, tile: TileDef) => void;
  onSelect: (tile: TileDef) => void;
}) {
  const { tiles, query, openCats, selectedTileId, onToggle, onDragStart, onSelect } = props;
  const filtered = query ? tiles.filter((t) => t.name.toLowerCase().includes(query)) : tiles;
  const categories = Array.from(new Set(filtered.map((t) => t.category)));

  if (categories.length === 0) {
    return <p className="map-toolbar__empty">Sin resultados.</p>;
  }

  return (
    <>
      {categories.map((cat) => {
        const isOpen = Boolean(query) || openCats.has(cat);
        const catTiles = filtered.filter((t) => t.category === cat);
        return (
          <section key={cat} className="map-toolbar__category">
            <button
              type="button"
              className="map-toolbar__category-header"
              onClick={() => onToggle(cat)}
              aria-expanded={isOpen}
            >
              <span className="map-toolbar__chevron">{isOpen ? '▾' : '▸'}</span>
              <span className="map-toolbar__category-name">{cat}</span>
              <span className="map-toolbar__count">{catTiles.length}</span>
            </button>
            {isOpen && catTiles.length > 0 ? (
              <div className="map-tile-grid">
                {catTiles.map((tile) => {
                  const isPicked = tile.id === selectedTileId;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      className={`map-tile-item${isPicked ? ' map-tile-item--selected' : ''}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, tile)}
                      onClick={() => onSelect(tile)}
                      title={tile.name}
                      aria-label={tile.name}
                      aria-pressed={isPicked}
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
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

function FATileList(props: {
  catalog?: FACatalog | null;
  query: string;
  openCats: Set<string>;
  selectedTileId?: string | null;
  onToggle: (catId: string) => void;
  onDragStart: (e: React.DragEvent, tile: FATileDef) => void;
  onSelect: (tile: FATileDef) => void;
}) {
  const { catalog, query, openCats, selectedTileId, onToggle, onDragStart, onSelect } = props;

  if (!catalog) {
    return <p className="map-toolbar__empty">Cargando assets FA…</p>;
  }

  if (query) {
    const results: FATileDef[] = [];
    for (const cat of catalog.categories) {
      for (const sub of cat.subcategories) {
        for (const tile of sub.tiles) {
          if (tile.name.toLowerCase().includes(query)) {
            results.push(tile);
          }
        }
      }
      if (results.length >= 200) break;
    }
    if (results.length === 0) {
      return <p className="map-toolbar__empty">Sin resultados.</p>;
    }
    return (
      <div className="map-tile-grid">
        {results.map((tile) => {
          const isPicked = tile.id === selectedTileId;
          return (
            <button
              key={tile.id}
              type="button"
              className={`map-tile-item${isPicked ? ' map-tile-item--selected' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, tile)}
              onClick={() => onSelect(tile)}
              title={tile.name}
              aria-label={tile.name}
              aria-pressed={isPicked}
            >
              <img
                src={tile.src}
                alt={tile.name}
                width={48}
                height={48}
                loading="lazy"
                aria-hidden={false}
              />
              <span className="map-tile-item__name">{tile.name}</span>
            </button>
          );
        })}
        {results.length >= 200 ? (
          <p className="map-toolbar__empty">Mostrando primeros 200 resultados. Refina la búsqueda.</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {catalog.categories.map((cat) => {
        const isOpen = openCats.has(cat.id);
        return (
          <section key={cat.id} className="map-toolbar__category">
            <button
              type="button"
              className="map-toolbar__category-header"
              onClick={() => onToggle(cat.id)}
              aria-expanded={isOpen}
            >
              <span className="map-toolbar__chevron">{isOpen ? '▾' : '▸'}</span>
              <span className="map-toolbar__category-name">{cat.label}</span>
              <span className="map-toolbar__count">{cat.tileCount}</span>
            </button>
            {isOpen ? (
              <div className="map-toolbar__fa-subcategories">
                {cat.subcategories.map((sub) => (
                  <details key={sub.id} className="map-toolbar__fa-sub">
                    <summary className="map-toolbar__fa-sub-header">
                      {sub.label} <span className="map-toolbar__count">{sub.tiles.length}</span>
                    </summary>
                    <div className="map-tile-grid">
                      {sub.tiles.map((tile) => {
                        const isPicked = tile.id === selectedTileId;
                        return (
                          <button
                            key={tile.id}
                            type="button"
                            className={`map-tile-item${isPicked ? ' map-tile-item--selected' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, tile)}
                            onClick={() => onSelect(tile)}
                            title={tile.name}
                            aria-label={tile.name}
                            aria-pressed={isPicked}
                          >
                            <img
                              src={tile.src}
                              alt={tile.name}
                              width={48}
                              height={48}
                              loading="lazy"
                              aria-hidden={false}
                            />
                            <span className="map-tile-item__name">{tile.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
