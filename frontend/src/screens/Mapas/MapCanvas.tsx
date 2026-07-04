import { useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type Konva from 'konva';
import type { MapDTO, MapElementDTO } from '../../net';
import { DraggableTile } from './DraggableTile';

export interface MapCanvasProps {
  map: MapDTO;
  selectedElementId: string | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onSelectElement: (id: string | null) => void;
  onDragEndElement: (id: string, x: number, y: number) => void;
  onDropTile: (tileId: string, x: number, y: number) => void;
}

/** Cada entrada: [x1, y1, x2, y2] — los cuatro puntos de una `<Line>`. */
type GridLine = readonly [number, number, number, number];

/**
 * Canvas central del editor: un `<Stage>` con una `<Layer>` por cada
 * `MapLayer` visible. Cada elemento es un `<DraggableTile>` y el grid se
 * dibuja con `<Line>` en la capa de fondo.
 *
 * El drop desde el toolbar (HTML5 drag) se resuelve calculando la posición
 * del puntero relativa al Stage — el `onDropTile` recibe coordenadas ya en
 * mundo y aplica snap en el handler.
 */
export function MapCanvas({
  map,
  selectedElementId,
  stageRef,
  onSelectElement,
  onDragEndElement,
  onDropTile,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const tileId = e.dataTransfer.getData('application/x-grimorio-tile');
    if (!tileId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getRelativePointerPosition?.();
    const worldX = pointer?.x ?? 0;
    const worldY = pointer?.y ?? 0;
    const snappedX = Math.round(worldX / map.gridSize) * map.gridSize;
    const snappedY = Math.round(worldY / map.gridSize) * map.gridSize;
    onDropTile(tileId, snappedX, snappedY);
  }

  const gridLines: GridLine[] = [];
  for (let x = 0; x <= map.width * map.gridSize; x += map.gridSize) {
    gridLines.push([x, 0, x, map.height * map.gridSize]);
  }
  for (let y = 0; y <= map.height * map.gridSize; y += map.gridSize) {
    gridLines.push([0, y, map.width * map.gridSize, y]);
  }

  const visibleElements = (layerElements: MapElementDTO[]) =>
    layerElements.map((el) => (
      <DraggableTile
        key={el.id}
        element={el}
        gridSize={map.gridSize}
        selected={el.id === selectedElementId}
        onSelect={onSelectElement}
        onDragEnd={onDragEndElement}
      />
    ));

  return (
    <div
      className="map-canvas-container"
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => onSelectElement(null)}
    >
      <Stage
        ref={stageRef}
        width={Math.max(320, map.width * map.gridSize)}
        height={Math.max(200, map.height * map.gridSize)}
      >
        <Layer listening={false}>
          {gridLines.map((line, idx) => (
            <Line
              key={`grid-${idx}`}
              points={[line[0], line[1], line[2], line[3]]}
              stroke="rgba(232,226,208,0.12)"
              strokeWidth={1}
            />
          ))}
        </Layer>
        {map.layers
          .filter((l) => l.visible)
          .map((layer) => (
            <Layer key={layer.id}>{visibleElements(layer.elements)}</Layer>
          ))}
      </Stage>
    </div>
  );
}