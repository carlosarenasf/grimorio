import { useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type { MapDTO, MapElementDTO } from '../../net';
import { DraggableTile } from './DraggableTile';

export interface MapCanvasProps {
  map: MapDTO;
  selectedElementId: string | null;
  stageRef: React.MutableRefObject<any>;
  onSelectElement: (id: string | null) => void;
  onDragEndElement: (id: string, x: number, y: number) => void;
  onDropTile: (tileId: string, x: number, y: number) => void;
}

/**
 * Canvas central del editor: un `<Stage>` con una `<Layer>` por cada
 * `MapLayer` visible. Cada elemento es un `<DraggableTile>` y el grid se
 * dibuja con `<Line>` en una capa de fondo opcional.
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
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const pointer = stage.getRelativePointerPosition?.();
    // Prefer Stage's own pointer projection; fall back to manual transform.
    const worldX = pointer?.x ?? px;
    const worldY = pointer?.y ?? py;
    const snappedX = Math.round(worldX / map.gridSize) * map.gridSize;
    const snappedY = Math.round(worldY / map.gridSize) * map.gridSize;
    void stage;
    onDropTile(tileId, snappedX, snappedY);
  }

  // Build grid lines once per map dims.
  const gridLines = [];
  for (let x = 0; x <= map.width * map.gridSize; x += map.gridSize) {
    gridLines.push([x, 0, x, map.height * map.gridSize]);
  }
  for (let y = 0; y <= map.height * map.gridSize; y += map.gridSize) {
    gridLines.push([0, y, map.width * map.gridSize, y]);
  }
  const gridPoints = gridLines.flatMap((pts) => pts);

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
        <Layer>
          {gridPoints.map((_, idx) =>
            idx % 4 === 0 ? (
              <Line
                key={`grid-${idx}`}
                points={[
                  gridPoints[idx],
                  gridPoints[idx + 1],
                  gridPoints[idx + 2],
                  gridPoints[idx + 3],
                ]}
                stroke="rgba(232,226,208,0.12)"
                strokeWidth={1}
                listening={false}
              />
            ) : null,
          )}
        </Layer>
        {map.layers
          .filter((l) => l.visible)
          .map((layer) => (
            <Layer key={layer.id}>
              {layer.elements.map((el: MapElementDTO) => (
                <DraggableTile
                  key={el.id}
                  element={el}
                  gridSize={map.gridSize}
                  selected={el.id === selectedElementId}
                  onSelect={onSelectElement}
                  onDragEnd={onDragEndElement}
                />
              ))}
            </Layer>
          ))}
      </Stage>
    </div>
  );
}