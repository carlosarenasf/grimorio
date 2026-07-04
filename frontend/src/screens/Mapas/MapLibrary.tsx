import type { MapDTO } from '../../net';

export interface MapLibraryProps {
  maps: MapDTO[];
  onOpen: (map: MapDTO) => void;
  onDelete: (map: MapDTO) => void;
}

function typeBadge(map: MapDTO): string {
  return map.type === 'exterior' ? 'Ext' : 'Int';
}

/** Biblioteca de mapas: tarjetas con miniatura (SVG inline) + nombre/tipo. */
export function MapLibrary({ maps, onOpen, onDelete }: MapLibraryProps) {
  return (
    <div className="map-library" aria-label="Biblioteca de mapas">
      <h2 className="font-display map-library__title">Biblioteca de mapas</h2>
      {maps.length === 0 ? (
        <p className="map-library__empty">No hay mapas en esta campaña todavía.</p>
      ) : (
        <ul className="map-library__grid">
          {maps.map((map) => (
            <li key={map.id} data-testid="map-card" className="map-card">
              <div
                className="map-card__thumb"
                aria-hidden
                dangerouslySetInnerHTML={{ __html: thumbSVG(map) }}
              />
              <div className="map-card__info">
                <p className="map-card__name">{map.name}</p>
                <p className="map-card__meta">
                  <span className={`map-card__badge map-card__badge--${map.type}`}>{typeBadge(map)}</span>
                  <span>{map.environment}</span>
                </p>
              </div>
              <div className="map-card__actions">
                <button
                  type="button"
                  className="map-card__open"
                  onClick={() => onOpen(map)}
                  aria-label={`Abrir ${map.name}`}
                >
                  ✎ Abrir editor
                </button>
                <button
                  type="button"
                  className="map-card__delete"
                  onClick={() => onDelete(map)}
                  aria-label={`Eliminar ${map.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Miniatura SVG: un mosaico de los tiles de la primera capa (si tiene). */
function thumbSVG(map: MapDTO): string {
  if (map.layers.length === 0) {
    return `<svg viewBox="0 0 16 16" width="64" height="64"><rect width="16" height="16" fill="#2a2640"/></svg>`;
  }
  const cells = 16;
  return `<svg viewBox="0 0 ${cells} ${cells}" width="64" height="64" shape-rendering="crispEdges">
    <rect width="${cells}" height="${cells}" fill="#2a2640"/>
    ${Array.from({ length: cells * cells }, (_, i) => {
      const x = i % cells;
      const y = Math.floor(i / cells);
      if ((x + y) % 2 === 0) return `<rect x="${x}" y="${y}" width="1" height="1" fill="#3a3550"/>`;
      return '';
    }).join('')}
  </svg>`;
}