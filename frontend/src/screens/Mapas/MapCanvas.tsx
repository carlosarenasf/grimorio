import { useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type Konva from 'konva';
import type { MapDTO, MapElementDTO } from '../../net';
import { DraggableTile } from './DraggableTile';

export type PaintMode = 'select' | 'paint' | 'erase';

export interface MapCanvasProps {
  map: MapDTO;
  selectedElementId: string | null;
  /** Tile seleccionado en el toolbar (modo pintar). */
  selectedTileId: string | null;
  /** Modo activo: seleccionar / pintar / borrar. */
  paintMode: PaintMode;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onSelectElement: (id: string | null) => void;
  onDragEndElement: (id: string, x: number, y: number) => void;
  onDropTile: (tileId: string, x: number, y: number) => void;
  onPaintAt: (tileId: string, x: number, y: number) => void;
  onEraseElement: (elementId: string) => void;
}

/** Cada entrada: [x1, y1, x2, y2] — los cuatro puntos de una `<Line>`. */
type GridLine = readonly [number, number, number, number];

/**
 * Canvas central del editor: un `<Stage>` con una `<Layer>` por cada
 * `MapLayer` visible. Cada elemento es un `<DraggableTile>` y el grid se
 * dibuja con `<Line>` en la capa de fondo.
 *
 * Soporta tres modos:
 *  - `select`: click en un elemento lo selecciona; click en el fondo
 *    deselecciona; arrastrar un elemento lo mueve.
 *  - `paint`: con un `selectedTileId`, cada click en el fondo suelta un
 *    tile en la celda clicada (snap a grid).
 *  - `erase`: click en un elemento lo elimina.
 *
 * El drop del toolbar (HTML5 drag) siempre pinta; resolvemos la posición con
 * `getBoundingClientRect` porque Konva no actualiza su puntero interno
 * durante un evento del DOM (de ahí el bug del "siempre columna 0").
 */
export function MapCanvas({
  map,
  selectedElementId,
  selectedTileId,
  paintMode,
  stageRef,
  onSelectElement,
  onDragEndElement,
  onDropTile,
  onPaintAt,
  onEraseElement,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /** Resuelve coords (x, y) del mundo a partir de un evento del DOM. */
  function worldFromClient(clientX: number, clientY: number): { x: number; y: number } {
    const rect = containerRef.current?.getBoundingClientRect();
    const stage = stageRef.current;
    const offX = stage?.x?.() ?? 0;
    const offY = stage?.y?.() ?? 0;
    const scale = stage?.scaleX?.() ?? 1;
    const invScale = scale === 0 ? 1 : 1 / scale;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - offX) * invScale,
      y: (clientY - rect.top - offY) * invScale,
    };
  }

  function snap(value: number): number {
    return Math.round(value / map.gridSize) * map.gridSize;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const tileId = e.dataTransfer.getData('application/x-grimorio-tile');
    if (!tileId) return;
    const { x, y } = worldFromClient(e.clientX, e.clientY);
    onDropTile(tileId, snap(x), snap(y));
  }

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    // Click en el fondo del Stage (no en un Group hijo): DraggableTile ya
    // cancela la propagación cuando lo maneja él mismo.
    const target = e.target;
    const isStageBackground =
      target === stageRef.current || target.getClassName?.() === 'Stage' || target.className === 'Stage';
    if (!isStageBackground) return;
    if (paintMode === 'paint' && selectedTileId) {
      const pointer = stageRef.current?.getPointerPosition?.();
      if (!pointer) return;
      onPaintAt(selectedTileId, snap(pointer.x), snap(pointer.y));
    } else if (paintMode === 'select') {
      onSelectElement(null);
    }
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
        paintMode={paintMode}
        onSelect={onSelectElement}
        onDragEnd={onDragEndElement}
        onErase={onEraseElement}
      />
    ));

  return (
    <div
      className="map-canvas-container"
      ref={containerRef}
      data-paint-mode={paintMode}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={Math.max(320, map.width * map.gridSize)}
        height={Math.max(200, map.height * map.gridSize)}
        onClick={handleStageClick}
        onTap={handleStageClick}
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