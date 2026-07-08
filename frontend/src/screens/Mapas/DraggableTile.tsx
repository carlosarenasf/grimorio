import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import type { MapElementDTO } from '../../net';
import { getTile, tileToDataURL } from './tiles';
import type { PaintMode } from './MapCanvas';

export interface DraggableTileProps {
  element: MapElementDTO;
  gridSize: number;
  selected: boolean;
  paintMode: PaintMode;
  onSelect: (id: string | null) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onErase: (elementId: string) => void;
  resolveTileUrl?: (tileId: string) => string;
}

/**
 * Wrapper de un tile en el canvas: `<Group draggable>` con un `<KonvaImage>`.
 * El snap-a-grid se aplica en `onDragEnd` (Math.round(x/gridSize)*gridSize).
 *
 * En modo `erase`, un click borra el elemento en lugar de seleccionarlo. En
 * cualquier otro modo el click selecciona y cancela la propagación para que
 * el handler del Stage no interprete el click como "fondo" (y deseleccione
 * o pinte encima).
 *
 * Soporta tanto tiles SVG inline (catálogo local) como tiles de imagen FA
 * (PNG servidos desde `/fa-assets/`). La resolución de la URL se delega en
 * `resolveTileUrl` si se proporciona; en caso contrario se usa el catálogo
 * SVG por defecto.
 */
function resolveDefaultTileUrl(tileId: string): string {
  const tile = getTile(tileId);
  return tile ? tileToDataURL(tile) : '';
}

export function DraggableTile({
  element,
  gridSize,
  selected,
  paintMode,
  onSelect,
  onDragEnd,
  onErase,
  resolveTileUrl,
}: DraggableTileProps) {
  const imageUrl = resolveTileUrl
    ? resolveTileUrl(element.tileId)
    : resolveDefaultTileUrl(element.tileId);
  const [image] = useImage(imageUrl, 'anonymous');
  const groupRef = useRef<Konva.Group>(null);

  // Konva sometimes needs a redraw nudge when the image arrives async.
  useEffect(() => {
    const node = groupRef.current;
    if (node?.getLayer && image) {
      node.getLayer()?.batchDraw?.();
    }
  }, [image]);

  const draggable = paintMode === 'select';

  return (
    <Group
      ref={groupRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={draggable}
      onClick={(e) => {
        e.cancelBubble = true;
        if (paintMode === 'erase') {
          onErase(element.id);
          return;
        }
        onSelect(element.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (paintMode === 'erase') {
          onErase(element.id);
          return;
        }
        onSelect(element.id);
      }}
      onDragEnd={(e) => {
        const node = e.target as Konva.Group;
        const rawX = node.x();
        const rawY = node.y();
        const snappedX = Math.round(rawX / gridSize) * gridSize;
        const snappedY = Math.round(rawY / gridSize) * gridSize;
        node.x(snappedX);
        node.y(snappedY);
        onDragEnd(element.id, snappedX, snappedY);
      }}
    >
      <KonvaImage
        image={image}
        width={element.width}
        height={element.height}
        stroke={selected ? '#c9a227' : undefined}
        strokeWidth={selected ? 2 : 0}
      />
    </Group>
  );
}