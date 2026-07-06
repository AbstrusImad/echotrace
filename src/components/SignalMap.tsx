import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { AnalysisResult, AnalysisVerdict } from "../types/analysis";
import { SIGNAL_METRICS } from "../types/analysis";

type SignalMapProps = {
  phase: "analyzing" | "result";
  result?: AnalysisResult | null;
};

const palette: Record<AnalysisVerdict | "Analyzing", string[]> = {
  Organic: ["#22e6a8", "#2dd4bf", "#00d9ff"],
  "Artificial Hype": ["#ff4d6d", "#d946ef", "#8b5cf6"],
  Coordinated: ["#ffb020", "#8b5cf6", "#2f80ff"],
  Unclear: ["#7a8aa0", "#2f80ff", "#00d9ff"],
  Analyzing: ["#38e1c8", "#2f80ff", "#8b5cf6"],
};

const SIZE = 440;
const CENTER = SIZE / 2;
const RADIUS = 168;
const AXES = SIGNAL_METRICS.length;

function pointFor(index: number, value: number) {
  const angle = (Math.PI * 2 * index) / AXES - Math.PI / 2;
  const r = (Math.max(0, Math.min(100, value)) / 100) * RADIUS;
  return {
    x: CENTER + Math.cos(angle) * r,
    y: CENTER + Math.sin(angle) * r,
    ax: CENTER + Math.cos(angle) * (RADIUS + 26),
    ay: CENTER + Math.sin(angle) * (RADIUS + 26),
    lx: CENTER + Math.cos(angle) * RADIUS,
    ly: CENTER + Math.sin(angle) * RADIUS,
  };
}

// Animated count-up number that only shows a value once it exists on chain.
function CountUp({ value, color }: { value: number | null; color: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v)}`);
  useEffect(() => {
    if (value == null) return;
    const controls = animate(mv, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] });
    return controls.stop;
  }, [value, mv]);
  if (value == null) return <span style={{ color }}>--</span>;
  return (
    <motion.span style={{ color }}>
      <motion.span>{text}</motion.span>
    </motion.span>
  );
}

export function SignalMap({ phase, result }: SignalMapProps) {
  const verdict = result?.verdict ?? "Analyzing";
  const colors = palette[verdict];
  const ready = phase === "result" && !!result;

  const values = SIGNAL_METRICS.map((m) =>
    ready ? (result!.signals[m.key] as number) : null,
  );

  // While scanning, the polygon breathes at a low baseline; when ready it snaps
  // to the real on-chain metric values.
  const polygonPoints = SIGNAL_METRICS.map((_, i) => {
    const v = ready ? (values[i] as number) : 30;
    const p = pointFor(i, v);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div
      className={`signal-map map-${String(verdict).replace(/\s+/g, "-").toLowerCase()} ${ready ? "is-ready" : "is-scanning"}`}
      aria-label="Signal propagation radar"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.9" />
            <stop offset="45%" stopColor={colors[1]} stopOpacity="0.22" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="webFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.42" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0.12" />
          </linearGradient>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* concentric grid rings */}
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle
            key={k}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * k}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* axis spokes + labels */}
        {SIGNAL_METRICS.map((m, i) => {
          const p = pointFor(i, 100);
          return (
            <g key={m.key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={p.lx}
                y2={p.ly}
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="1"
              />
              <text
                x={p.ax}
                y={p.ay}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-axis-label"
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* rotating sweep while scanning */}
        {!ready && (
          <motion.g
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
          >
            <path
              d={`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS * Math.sin(1)} ${CENTER - RADIUS * Math.cos(1)} Z`}
              fill={colors[0]}
              opacity="0.12"
            />
          </motion.g>
        )}

        {/* pulsing propagation rings */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * 0.35}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth="1.4"
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            animate={{ scale: [0.4, 1.15], opacity: [0.5, 0] }}
            transition={{ duration: 3.2, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
          />
        ))}

        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.7} fill="url(#coreGlow)" />

        {/* the metric polygon */}
        <motion.polygon
          points={polygonPoints}
          fill="url(#webFill)"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinejoin="round"
          filter="url(#mapGlow)"
          initial={false}
          animate={{ points: polygonPoints, opacity: ready ? 1 : 0.55 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        />

        {/* metric vertices */}
        {SIGNAL_METRICS.map((m, i) => {
          const v = ready ? (values[i] as number) : 30;
          const p = pointFor(i, v);
          return (
            <motion.circle
              key={m.key}
              cx={p.x}
              cy={p.y}
              r={ready ? 4.5 : 3}
              fill="#ffffff"
              stroke={colors[0]}
              strokeWidth="2"
              initial={false}
              animate={{ cx: p.x, cy: p.y }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            />
          );
        })}

        {/* animated core */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r="7"
          fill="#ffffff"
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
      </svg>

      {/* live metric readouts */}
      <div className="radar-readouts">
        {SIGNAL_METRICS.map((m, i) => (
          <div
            key={m.key}
            className={`radar-readout ${ready ? "ready" : "scanning"}`}
          >
            <span className="radar-readout-label">{m.label}</span>
            <span className="radar-readout-value">
              {ready ? (
                <>
                  <CountUp value={values[i] as number} color={colors[0]} />
                  <i>%</i>
                </>
              ) : (
                <span className="radar-dots" style={{ color: colors[0] }}>
                  <motion.i animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                  <motion.i animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                  <motion.i animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
