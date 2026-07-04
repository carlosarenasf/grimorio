import { useRef, useState } from 'react';
import type Konva from 'konva';
import type { MapDTO, MapElementDTO, MapLayerDTO } from '../../net';
import { TILES } from './tiles';
import { MapToolbar } from './MapToolbar';
import { MapCanvas } from './MapCanvas';
import { MapLayersPanel } from './MapLayersPanel';
import { MapTopBar } from './MapTopBar';

export interface MapEditorProps {
  map: MapDTO;
  onChange: (map: MapDTO) => void;
  onSave: () => void;
  onBack: () => void;
}

/**
 * Editor drag & drop de un mapa: 3 columnas (toolbar | canvas | capas) con
 * barra superior. Mantiene el estado local "sucio" comparando con el snapshot
 * serializado del mapa inicial; el padre decide cuándo persistir (onSave).
 */
export function MapEditor({ map, onChange, onSave, onBack }: MapEditorProps) {
  const [draft, setDraft] = useState<MapDTO>(map);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const stageRef = useRef<Konva.Stage | null>(null);
  const initialJson = useRef(JSON.stringify(map));

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

  function handleDropTile(tileId: string, x: number, y: number) {
    const layer = draft.layers.find((l) => l.visible);
    const targetLayerId = layer?.id ?? draft.layers[0]?.id;
    if (!targetLayerId) return;
    const element: MapElementDTO = {
      id: `el_${Date.now()}`,
      tileId,
      x,
      y,
      width: 32,
      height: 32,
      rotation: 0,
      layerId: targetLayerId,
    };
    patch({
      ...draft,
      layers: draft.layers.map((l) =>
        l.id === targetLayerId ? { ...l, elements: [...l.elements, element] } : l,
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
        onBack={onBack}
        onSave={handleSave}
        onExportPNG={handleExportPNG}
        onRename={handleRename}
      />
      <div className="map-editor__body">
        <MapToolbar tiles={TILES} onSelectTile={() => {}} />
        <div className="map-canvas-wrapper">
          <label className="map-canvas-gridtoggle">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Mostrar grid
          </label>
          <MapCanvas
            map={{ ...draft, gridSize: showGrid ? draft.gridSize : draft.gridSize }}
            selectedElementId={selectedElementId}
            stageRef={stageRef}
            onSelectElement={setSelectedElementId}
            onDragEndElement={handleDragEndElement}
            onDropTile={handleDropTile}
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