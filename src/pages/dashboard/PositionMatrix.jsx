import { POSITION_MAX_AXIS_SCORE, POSITION_THRESHOLD } from '../positionCalc.js';

// Position 2×2 (Clarity only). x = Inner Clarity, y = Outer Action; the dashed
// lines sit on the locked threshold. Quadrants are labelled in place.
const W = 300;
const H = 230;
const PAD = 18;

const quadrants = [
  { name: 'Kinetic Operator', sub: 'Low Inner · High Outer', x: 'low', y: 'high', fill: '#FBF0DA' },
  { name: 'Momentum Builder', sub: 'High Inner · High Outer', x: 'high', y: 'high', fill: '#EAF0F7' },
  { name: 'System Evaluator', sub: 'Low Inner · Low Outer', x: 'low', y: 'low', fill: '#EFF3EC' },
  { name: 'Strategic Planner', sub: 'High Inner · Low Outer', x: 'high', y: 'low', fill: '#F1EAF7' },
];

export default function PositionMatrix({ position }) {
  if (!position) return null;
  const scaleX = (value) => PAD + (value / POSITION_MAX_AXIS_SCORE) * (W - 2 * PAD);
  const scaleY = (value) => H - PAD - (value / POSITION_MAX_AXIS_SCORE) * (H - 2 * PAD);
  const xT = scaleX(POSITION_THRESHOLD);
  const yT = scaleY(POSITION_THRESHOLD);
  const box = (q) => ({
    x: q.x === 'low' ? PAD : xT,
    y: q.y === 'high' ? PAD : yT,
    w: q.x === 'low' ? xT - PAD : W - PAD - xT,
    h: q.y === 'high' ? yT - PAD : H - PAD - yT,
  });
  const px = scaleX(Math.min(POSITION_MAX_AXIS_SCORE, Math.max(0, position.innerAxis)));
  const py = scaleY(Math.min(POSITION_MAX_AXIS_SCORE, Math.max(0, position.outerAxis)));

  return (
    <div className="position-matrix">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Position matrix: ${position.quadrant}, Inner ${position.innerAxis} of 40, Outer ${position.outerAxis} of 40`}>
        {quadrants.map((q) => {
          const b = box(q);
          const active = q.name === position.quadrant;
          return (
            <g key={q.name}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={q.fill} opacity={active ? 1 : 0.55} />
              <text x={b.x + 6} y={b.y + 14} fontSize="9" fontWeight="700" fill="#0D1028" opacity={active ? 1 : 0.6}>{q.name}</text>
              <text x={b.x + 6} y={b.y + 25} fontSize="7.5" fill="#3A4A6B" opacity={active ? 1 : 0.6}>{q.sub}</text>
            </g>
          );
        })}
        <line x1={xT} y1={PAD} x2={xT} y2={H - PAD} stroke="#B7ADA0" strokeDasharray="3,3" />
        <line x1={PAD} y1={yT} x2={W - PAD} y2={yT} stroke="#B7ADA0" strokeDasharray="3,3" />
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="#3A4A6B" strokeWidth="1.5" />
        <text x={W / 2} y={H - 3} fontSize="8.5" fill="#3A4A6B" fontWeight="700" textAnchor="middle">INNER CLARITY →</text>
        <text x={8} y={H / 2} fontSize="8.5" fill="#3A4A6B" fontWeight="700" textAnchor="middle" transform={`rotate(-90 8 ${H / 2})`}>OUTER ACTION →</text>
        <circle cx={px} cy={py} r="6" fill="#D4A056" stroke="#0D1028" strokeWidth="1.5" />
      </svg>
      <p className="position-matrix-note">
        Inner {position.innerAxis.toFixed(1)} / 40 · Outer {position.outerAxis.toFixed(1)} / 40 · Threshold {POSITION_THRESHOLD} (single constant, Build Spec §5)
      </p>
    </div>
  );
}
