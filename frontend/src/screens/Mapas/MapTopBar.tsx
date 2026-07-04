import { Button } from '../../design';
import type { MapDTO } from '../../net';

export interface MapTopBarProps {
  map: MapDTO;
  dirty: boolean;
  onBack: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onRename: (name: string) => void;
}

/**
 * Barra superior del editor: nombre editable (inline), tipo, entorno,
 * botones Guardar / Exportar PNG / Volver.
 */
export function MapTopBar({ map, dirty, onBack, onSave, onExportPNG, onRename }: MapTopBarProps) {
  return (
    <header className="map-topbar" aria-label="Barra superior del editor">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Volver
      </Button>
      <div className="map-topbar__title">
        <input
          className="map-topbar__name"
          value={map.name}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Nombre del mapa"
        />
        <span className="map-topbar__meta">
          {map.type} · {map.environment} · {map.width}×{map.height} celdas
        </span>
        {dirty ? <span className="map-topbar__dirty" aria-label="Cambios sin guardar">●</span> : null}
      </div>
      <div className="map-topbar__actions">
        <Button variant="secondary" size="sm" onClick={onExportPNG}>
          ⬇ Exportar PNG
        </Button>
        <Button size="sm" onClick={onSave} disabled={!dirty}>
          Guardar
        </Button>
      </div>
    </header>
  );
}