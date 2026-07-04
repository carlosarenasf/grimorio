import type { MapLayerDTO } from '../../net';

export interface MapLayersPanelProps {
  layers: MapLayerDTO[];
  selectedElementId: string | null;
  onToggleVisible: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
}

/**
 * Panel derecho del editor de mapas: lista de capas (toggle visible/oculta),
 * botón para añadir capa y eliminar capa. La selección de elementos vive en
 * el canvas; aquí solo gestionamos la pila de capas.
 */
export function MapLayersPanel({
  layers,
  onToggleVisible,
  onAddLayer,
  onDeleteLayer,
}: MapLayersPanelProps) {
  return (
    <aside className="map-layers-panel" aria-label="Capas del mapa">
      <div className="map-layers-panel__header">
        <h3 className="eyebrow">Capas</h3>
        <button type="button" className="map-layers-panel__add" onClick={onAddLayer}>
          + Añadir capa
        </button>
      </div>
      <ul className="map-layers-panel__list">
        {layers.map((layer) => (
          <li key={layer.id} className="map-layers-panel__item">
            <button
              type="button"
              role="switch"
              aria-checked={layer.visible}
              aria-label={layer.name}
              className="map-layers-panel__toggle"
              onClick={() => onToggleVisible(layer.id)}
            >
              {layer.visible ? '👁' : '⊘'}
            </button>
            <span className="map-layers-panel__name">{layer.name}</span>
            <button
              type="button"
              className="map-layers-panel__delete"
              onClick={() => onDeleteLayer(layer.id)}
              aria-label={`Eliminar capa ${layer.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}