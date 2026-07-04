/**
 * Mock de `react-konva` para tests jsdom.
 *
 * Konva necesita un canvas real (paquete `canvas`) para funcionar; en jsdom es
 * más rápido y fiable renderizar divs planos que simplemente pasan a través
 * los `children`. Los props se “aplanan” a `data-*` para que las aserciones
 * puedan inspeccionarlos sin depender del motor de render de Konva.
 */
import type { ReactNode } from 'react';

type AnyProps = Record<string, unknown> & { children?: ReactNode };

function passthrough(tag: string) {
  return function MockKonvaNode(props: AnyProps) {
    return (
      <div
        data-konva={tag}
        {...Object.fromEntries(
          Object.entries(props)
            .filter(([k]) => k !== 'children')
            .map(([k, v]) => [`data-${k}`, typeof v === 'string' ? v : JSON.stringify(v)]),
        )}
      >
        {props.children ?? null}
      </div>
    );
  };
}

export const Stage = passthrough('Stage');
export const Layer = passthrough('Layer');
export const Group = passthrough('Group');
export const Image = passthrough('Image');
export const Rect = passthrough('Rect');
export const Line = passthrough('Line');
export const Circle = passthrough('Circle');
export const Text = passthrough('Text');
export const Transformer = passthrough('Transformer');

export default {
  Stage,
  Layer,
  Group,
  Image,
  Rect,
  Line,
  Circle,
  Text,
  Transformer,
};