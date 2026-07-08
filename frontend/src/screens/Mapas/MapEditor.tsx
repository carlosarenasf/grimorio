import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import type { MapDTO, MapElementDTO, MapLayerDTO } from '../../net';
import { TILES, getTile, tileToDataURL, type TileDef } from './tiles';
import { MapToolbar } from './MapToolbar';
import { MapCanvas, type PaintMode } from './MapCanvas';
import { MapLayersPanel } from './MapLayersPanel';
import { MapTopBar } from './MapTopBar';
import {
  loadFACatalog,
  findFATile,
  isFATileId,
  type FACatalog,
  type FATileDef,
} from './fa-tiles';

export interface MapEditorProps {
  map: MapDTO;
  onChange: (map: MapDTO) => void;
  onSave: () => void;
  onBack: () => void;
}

/** Tile seleccionado en el toolbar: puede ser SVG local o imagen FA. */
type SelectedTile =
  | { kind: 'svg'; def: TileDef }
  | { kind: 'fa'; def: FATileDef };

/**
 * Editor drag & drop de un mapa: 3 columnas (toolbar | canvas | capas) con
 * barra superior. Mantiene el estado local "sucio" comparando con el snapshot
 * serializado del mapa inicial; el padre decide cuándo persistir (onSave).
 *
 * Modos de edición (toolbar superior):
 *  - **Seleccionar** (`select`): click selecciona elemento; arrastrar lo
 *    mueve (snap a grid). Click en el fondo deselecciona.
 *  - **Pintar** (`paint`): con un tile seleccionado en el catálogo, cada
 *    click en el fondo suelta una copia en la celda (paint rápido). El
 *    drag-and-drop desde el catálogo sigue funcionando siempre.
 *  - **Borrar** (`erase`): click en un elemento lo elimina.
 */
export function MapEditor({ map, onChange, onSave, onBack }: MapEditorProps) {
  const [draft, setDraft] = useState<MapDTO>(map);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null);
  const [paintMode, setPaintMode] = useState<PaintMode>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [faCatalog, setFACatalog] = useState<FACatalog | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const initialJson = useRef(JSON.stringify(map));

  useEffect(() => {
    loadFACatalog().then(setFACatalog).catch(() => {});
  }, []);

  const dirty = JSON.stringify(draft) !== initialJson.current;

  function patch(next: MapDTO) {
    setDraft(next);
    onChange(next);
  }

  function handleRename(name: string) {
    patch({ ...draft, name });
  }

  function handleAddLayer() {
    const id = `layer_${Date.now()}`;
    const newLayer: MapLayerDTO = {
      id,
      name: `Capa ${draft.layers.length + 1}`,
      visible: true,
      elements: [],
    };
    patch({ ...draft, layers: [...draft.layers, newLayer] });
  }

  function handleDeleteLayer(layerId: string) {
    patch({
      ...draft,
      layers: draft.layers.filter((l) => l.id !== layerId),
    });
  }

  function handleToggleVisible(layerId: string) {
    patch({
      ...draft,
      layers: draft.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    });
  }

  /** Drop del catálogo (HTML5 drag). Resuelve la layer destino (la primera
   * visible, o la 0) y aplica snap-a-grid en la coordenada calculada por
   * `MapCanvas` (que ahora usa `getBoundingClientRect` en lugar del
   * `getRelativePointerPosition` de Konva, que devolvía 0 en drop). */
  function handleDropTile(tileId: string, x: number, y: number) {
    const layer = draft.layers.find((l) => l.visible);
    const targetLayerId = layer?.id ?? draft.layers[0]?.id;
    if (!targetLayerId) return;
    addElement(tileId, targetLayerId, x, y);
  }

  /** Pintar mediante click (modo `paint`) sobre el fondo del canvas. */
  function handlePaintAt(tileId: string, x: number, y: number) {
    const layer = draft.layers.find((l) => l.visible);
    const targetLayerId = layer?.id ?? draft.layers[0]?.id;
    if (!targetLayerId) return;
    addElement(tileId, targetLayerId, x, y);
  }

  function addElement(tileId: string, layerId: string, x: number, y: number) {
    let width = draft.gridSize;
    let height = draft.gridSize;
    if (isFATileId(tileId) && faCatalog) {
      const faTile = findFATile(faCatalog, tileId);
      if (faTile) {
        width = faTile.gridW * draft.gridSize;
        height = faTile.gridH * draft.gridSize;
      }
    } else {
      const tile = getTile(tileId);
      if (tile) {
        width = tile.width;
        height = tile.height;
      }
    }
    const element: MapElementDTO = {
      id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tileId,
      x,
      y,
      width,
      height,
      rotation: 0,
      layerId,
    };
    patch({
      ...draft,
      layers: draft.layers.map((l) =>
        l.id === layerId ? { ...l, elements: [...l.elements, element] } : l,
      ),
    });
  }

  function handleDragEndElement(id: string, x: number, y: number) {
    patch({
      ...draft,
      layers: draft.layers.map((l) => ({
        ...l,
        elements: l.elements.map((e) => (e.id === id ? { ...e, x, y } : e)),
      })),
    });
  }

  function handleEraseElement(elementId: string) {
    patch({
      ...draft,
      layers: draft.layers.map((l) => ({
        ...l,
        elements: l.elements.filter((e) => e.id !== elementId),
      })),
    });
    if (selectedElementId === elementId) setSelectedElementId(null);
  }

  function handleSelectSvgTile(tile: TileDef) {
    setSelectedTile((prev) => {
      const wasSelected = prev?.kind === 'svg' && prev.def.id === tile.id;
      if (wasSelected) {
        setPaintMode('select');
        return null;
      }
      setPaintMode('paint');
      return { kind: 'svg', def: tile };
    });
  }

  function handleSelectFATile(tile: FATileDef) {
    setSelectedTile((prev) => {
      const wasSelected = prev?.kind === 'fa' && prev.def.id === tile.id;
      if (wasSelected) {
        setPaintMode('select');
        return null;
      }
      setPaintMode('paint');
      return { kind: 'fa', def: tile };
    });
  }

  const resolveTileUrl = useCallback(
    (tileId: string): string => {
      if (isFATileId(tileId) && faCatalog) {
        const faTile = findFATile(faCatalog, tileId);
        return faTile?.src ?? '';
      }
      const tile = getTile(tileId);
      return tile ? tileToDataURL(tile) : '';
    },
    [faCatalog],
  );

  function handleChangeMode(mode: PaintMode) {
    setPaintMode(mode);
    if (mode !== 'paint') setSelectedTile(null);
  }

  const selectedTileName = selectedTile
    ? selectedTile.kind === 'svg'
      ? selectedTile.def.name
      : selectedTile.def.name
    : null;
  const selectedTileId = selectedTile?.def.id ?? null;

  function handleChangeSize(width: number, height: number) {
    const clampedW = Math.max(5, Math.min(100, width));
    const clampedH = Math.max(5, Math.min(100, height));
    patch({ ...draft, width: clampedW, height: clampedH });
  }

  function handleExportPNG() {
    const stage = stageRef.current;
    if (!stage?.toDataURL) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${draft.name || 'mapa'}.png`;
    link.href = dataUrl;
    link.click();
  }

  function handleSave() {
    initialJson.current = JSON.stringify(draft);
    onSave();
  }

  return (
    <div className="map-editor" data-testid="map-editor">
      <MapTopBar
        map={draft}
        dirty={dirty}
        paintMode={paintMode}
        onBack={onBack}
        onSave={handleSave}
        onExportPNG={handleExportPNG}
        onRename={handleRename}
        onChangeSize={handleChangeSize}
        onChangeMode={handleChangeMode}
      />
      <div className="map-editor__body">
        <MapToolbar
          tiles={TILES}
          faCatalog={faCatalog}
          selectedTileId={selectedTileId}
          onSelectSvgTile={handleSelectSvgTile}
          onSelectFATile={handleSelectFATile}
        />
        <div className="map-canvas-wrapper">
          <label className="map-canvas-gridtoggle">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Mostrar grid
          </label>
          {selectedTileName ? (
            <div className="map-canvas-hint" role="status">
              Pincel: <strong>{selectedTileName}</strong> · click para pintar, drag sigue activo
            </div>
          ) : null}
          <MapCanvas
            map={{ ...draft, gridSize: showGrid ? draft.gridSize : draft.gridSize }}
            selectedElementId={selectedElementId}
            selectedTileId={selectedTileId}
            paintMode={paintMode}
            stageRef={stageRef}
            onSelectElement={setSelectedElementId}
            onDragEndElement={handleDragEndElement}
            onDropTile={handleDropTile}
            onPaintAt={handlePaintAt}
            onEraseElement={handleEraseElement}
            resolveTileUrl={resolveTileUrl}
          />
        </div>
        <MapLayersPanel
          layers={draft.layers}
          selectedElementId={selectedElementId}
          onToggleVisible={handleToggleVisible}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
        />
      </div>
    </div>
  );
}