import { useEffect, useRef, useState } from 'react';
import { DiceCanvas } from './DiceCanvas';
import type { DieType } from './Dice3D';
import type { DiceRollView } from './DiceRoller';

const FACE_SET = new Set([4, 6, 8, 10, 12, 20, 100]);

/** Turn a notation like "2d8+3" into ["d8","d8"]; non-NdM notations → []. */
function parseDice(notation?: string): DieType[] {
  if (!notation) return [];
  const m = /(\d*)d(\d+)/i.exec(notation);
  if (!m) return [];
  const count = Math.min(30, Math.max(1, parseInt(m[1] || '1', 10)));
  const faces = parseInt(m[2]!, 10);
  if (!FACE_SET.has(faces)) return [];
  return Array.from({ length: count }, () => `d${faces}` as DieType);
}

export interface DiceResult3DProps {
  latestRoll?: DiceRollView | null;
  color?: string;
}

/**
 * The inline 3D dice in the "classic" Dados panel: shows the latest roll's dice,
 * tumbling briefly each time a new roll arrives and settling on its result.
 */
export function DiceResult3D({ latestRoll, color }: DiceResult3DProps) {
  const [rolling, setRolling] = useState(false);
  const lastId = useRef<string | null>(latestRoll?.id ?? null);

  useEffect(() => {
    if (latestRoll && latestRoll.id !== lastId.current) {
      lastId.current = latestRoll.id;
      setRolling(true);
      const t = setTimeout(() => setRolling(false), 800);
      return () => clearTimeout(t);
    }
  }, [latestRoll?.id]);

  const dice = parseDice(latestRoll?.notation);
  const show: DieType[] = dice.length ? dice : ['d20'];

  return (
    <DiceCanvas
      dice={show}
      rolling={rolling}
      results={rolling ? null : (latestRoll?.results ?? null)}
      tone={latestRoll?.tone}
      color={color}
    />
  );
}
