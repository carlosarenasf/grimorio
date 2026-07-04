import { useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import type { MapElementDTO } from '../../net';
import { getTile, tileToDataURL } from './tiles';

export interface DraggableTileProps {
  element: MapElementDTO;
  gridSize: number;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

/**
 * Wrapper de un tile en el canvas: `<Group draggable>` con un `<KonvaImage>`.
 * El snap-a-grid se aplica en `onDragEnd` (Math.round(x/gridSize)*gridSize).
 */
export function DraggableTile({ element, gridSize, selected, onSelect, onDragEnd }: DraggableTileProps) {
  const tile = getTile(element.tileId);
  const dataUrl = tile ? tileToDataURL(tile) : '';
  const [image] = useImage(dataUrl, 'anonymous');
  const groupRef = useRef<Konva.Group>(null);

  // Konva sometimes needs a redraw nudge when the image arrives async.
  useEffect(() => {
    const node = groupRef.current;
    if (node?.getLayer && image) {
      node.getLayer()?.batchDraw?.();
    }
  }, [image]);

  return (
    <Group
      ref={groupRef}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
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