import { Button } from '../../design';
import type { MapDTO } from '../../net';
import type { PaintMode } from './MapCanvas';

export interface MapTopBarProps {
  map: MapDTO;
  dirty: boolean;
  paintMode: PaintMode;
  onBack: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onRename: (name: string) => void;
  onChangeSize: (width: number, height: number) => void;
  onChangeMode: (mode: PaintMode) => void;
}

const MODES: ReadonlyArray<{ id: PaintMode; label: string; icon: string }> = [
  { id: 'select', label: 'Seleccionar', icon: '↖' },
  { id: 'paint', label: 'Pintar', icon: '🖌' },
  { id: 'erase', label: 'Borrar', icon: '🧽' },
];

/**
 * Barra superior del editor: nombre editable (inline), tipo, entorno,
 * controles de tamaño del mapa, modo activo (seleccionar/pintar/borrar),
 * botones Guardar / Exportar PNG / Volver.
 *
 * Cambiar ancho/alto recorta o expande el área jugable sin tocar los
 * elementos ya colocados (los que quedan fuera del nuevo bounding box se
 * siguen guardando pero no se ven hasta volver a ampliar).
 */
export function MapTopBar({
  map,
  dirty,
  paintMode,
  onBack,
  onSave,
  onExportPNG,
  onRename,
  onChangeSize,
  onChangeMode,
}: MapTopBarProps) {
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

      <div className="map-topbar__tools" role="group" aria-label="Modo de edición">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`map-mode-btn${paintMode === m.id ? ' map-mode-btn--active' : ''}`}
            onClick={() => onChangeMode(m.id)}
            aria-pressed={paintMode === m.id}
            title={m.label}
          >
            <span aria-hidden>{m.icon}</span>
            <span className="map-mode-btn__label">{m.label}</span>
          </button>
        ))}
      </div>

      <label className="map-topbar__size">
        <span>Ancho</span>
        <input
          type="number"
          min={5}
          max={100}
          value={map.width}
          onChange={(e) => onChangeSize(Number(e.target.value) || map.width, map.height)}
          aria-label="Ancho del mapa en celdas"
        />
        <span>×</span>
        <span>Alto</span>
        <input
          type="number"
          min={5}
          max={100}
          value={map.height}
          onChange={(e) => onChangeSize(map.width, Number(e.target.value) || map.height)}
          aria-label="Alto del mapa en celdas"
        />
      </label>

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