export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/** SVG silhouette per die type (a 100×100 viewbox polygon + a short label). */
const SHAPES: Record<DieType, { points: string; label: string; facets: string[] }> = {
  d4: { points: '50,6 93,84 7,84', label: 'd4', facets: ['50,6 50,84', '50,84 28,46', '50,84 72,46'] },
  d6: { points: '22,22 78,22 78,78 22,78', label: 'd6', facets: ['22,40 78,40', '40,22 40,78'] },
  d8: { points: '50,5 90,50 50,95 10,50', label: 'd8', facets: ['10,50 90,50', '50,5 50,95'] },
  d10: { points: '50,5 88,40 70,92 30,92 12,40', label: 'd10', facets: ['50,5 30,92', '50,5 70,92', '12,40 88,40'] },
  d12: { points: '50,5 86,32 72,88 28,88 14,32', label: 'd12', facets: ['50,5 50,30', '86,32 64,44', '72,88 58,66', '28,88 42,66', '14,32 36,44'] },
  d20: { points: '50,4 89,27 89,73 50,96 11,73 11,27', label: 'd20', facets: ['50,33 50,4', '50,33 11,27', '50,33 89,27', '30,63 11,73', '70,63 89,73', '50,96 30,63', '50,96 70,63', '50,33 30,63', '50,33 70,63', '30,63 70,63'] },
  d100: { points: '50,5 88,40 70,92 30,92 12,40', label: 'd%', facets: ['50,5 30,92', '50,5 70,92', '12,40 88,40'] },
};

export interface Dice3DProps {
  type: DieType;
  /** Settled value to show; while `rolling` the face shows a tumbling glyph. */
  value?: number | null;
  rolling: boolean;
  /** Stagger multiple dice for a livelier tray. */
  delayMs?: number;
  /** crit → gold, fumble → ember, else neutral. */
  tone?: 'normal' | 'crit' | 'fumble';
}

/**
 * A single die rendered as its own polyhedral silhouette, tumbling in 3D (CSS
 * perspective + multi-axis rotation) while `rolling`, then settling on `value`.
 */
export function Dice3D({ type, value, rolling, delayMs = 0, tone = 'normal' }: Dice3DProps) {
  const shape = SHAPES[type];
  const gid = `die-grad-${type}`;
  return (
    <div
      className="die3d"
      data-rolling={rolling ? 'true' : 'false'}
      data-tone={tone}
      style={{ animationDelay: `${delayMs}ms` }}
      aria-label={`${type}${value != null && !rolling ? ` = ${value}` : ''}`}
    >
      <div className="die3d__inner">
        <svg viewBox="0 0 100 100" width="100%" height="100%" className="die3d__svg">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a3458" />
              <stop offset="1" stopColor="#181523" />
            </linearGradient>
          </defs>
          <polygon points={shape.points} fill={`url(#${gid})`} className="die3d__shape" />
          {shape.facets.map((f, i) => (
            <polyline key={i} points={f} className="die3d__facet" />
          ))}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="middle"
            className="die3d__num"
          >
            {rolling ? '' : (value ?? shape.label)}
          </text>
        </svg>
      </div>
    </div>
  );
}
