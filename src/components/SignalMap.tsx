import { motion } from "framer-motion";
import type { AnalysisResult, AnalysisVerdict } from "../types/analysis";

type SignalMapProps = {
  phase: "analyzing" | "result";
  result?: AnalysisResult | null;
};

const nodes = [
  { id: "a", x: 50, y: 50, r: 8, delay: 0 },
  { id: "b", x: 28, y: 35, r: 5, delay: 0.18 },
  { id: "c", x: 70, y: 29, r: 6, delay: 0.28 },
  { id: "d", x: 76, y: 63, r: 4, delay: 0.38 },
  { id: "e", x: 32, y: 70, r: 5, delay: 0.48 },
  { id: "f", x: 17, y: 55, r: 3, delay: 0.6 },
  { id: "g", x: 88, y: 43, r: 4, delay: 0.72 },
  { id: "h", x: 58, y: 79, r: 3, delay: 0.84 },
  { id: "i", x: 43, y: 20, r: 3, delay: 0.96 },
];

const paths = [
  "M 250 250 C 190 210, 170 175, 140 175",
  "M 250 250 C 300 205, 330 150, 350 145",
  "M 250 250 C 330 275, 360 310, 380 315",
  "M 250 250 C 205 285, 185 335, 160 350",
  "M 140 175 C 95 205, 80 240, 85 275",
  "M 350 145 C 405 160, 430 190, 440 215",
  "M 380 315 C 340 355, 300 385, 290 395",
  "M 160 350 C 210 370, 255 390, 290 395",
];

const palette: Record<AnalysisVerdict | "Analyzing", string[]> = {
  Organic: ["#22E6A8", "#2DD4BF", "#00D9FF"],
  "Artificial Hype": ["#FF4D6D", "#D946EF", "#8B5CF6"],
  Coordinated: ["#FFB020", "#8B5CF6", "#2F80FF"],
  Unclear: ["#7A8AA0", "#2F80FF", "#00D9FF"],
  Analyzing: ["#00D9FF", "#2F80FF", "#8B5CF6"],
};

export function SignalMap({ phase, result }: SignalMapProps) {
  const verdict = result?.verdict ?? "Analyzing";
  const colors = palette[verdict];
  const coordination = result?.signals.coordinationIndex ?? 64;
  const phraseSimilarity = result?.signals.phraseSimilarity ?? 58;

  return (
    <motion.div
      className={`signal-map map-${String(verdict).replace(/\s+/g, "-").toLowerCase()}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      aria-label="Signal propagation map"
    >
      <div className="map-grid" aria-hidden="true" />
      <motion.div
        className="scan-line"
        animate={{ y: ["-18%", "118%"] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 500 500" role="img">
        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <stop offset="55%" stopColor={colors[1]} stopOpacity="0.32" />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pathGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="55%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[80, 142, 205].map((radius, index) => (
          <motion.circle
            key={radius}
            cx="250"
            cy="250"
            r={radius}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth="1"
            strokeOpacity="0.18"
            initial={{ scale: 0.68, opacity: 0 }}
            animate={{ scale: [0.72, 1.06, 0.72], opacity: [0, 0.55, 0] }}
            transition={{
              duration: 3.8 + index,
              delay: index * 0.45,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "250px 250px" }}
          />
        ))}

        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth={index < 4 ? 2.2 : 1.35}
            strokeLinecap="round"
            strokeOpacity={phase === "result" ? 0.7 : 0.48}
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.15 + index * 0.11 }}
          />
        ))}

        <motion.circle
          cx="250"
          cy="250"
          r="82"
          fill="url(#coreGradient)"
          animate={{ scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "250px 250px" }}
        />

        {nodes.map((node, index) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: node.delay, type: "spring", stiffness: 180 }}
            style={{ transformOrigin: `${node.x * 5}px ${node.y * 5}px` }}
          >
            <motion.circle
              cx={node.x * 5}
              cy={node.y * 5}
              r={node.r * 2.4}
              fill={index === 0 ? colors[0] : colors[index % colors.length]}
              opacity="0.12"
              animate={{ scale: [1, 1.8, 1], opacity: [0.12, 0.02, 0.12] }}
              transition={{
                duration: 2.8 + index * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <circle
              cx={node.x * 5}
              cy={node.y * 5}
              r={node.r}
              fill={index === 0 ? "#FFFFFF" : colors[index % colors.length]}
              filter="url(#glow)"
            />
          </motion.g>
        ))}
      </svg>

      <div className="floating-label label-origin">Signal Origin</div>
      <div className="floating-label label-echo">
        Echo similarity {phraseSimilarity}%
      </div>
      <div className="floating-label label-sync">
        Coordination {coordination}%
      </div>
      <div className="map-caption">
        {phase === "analyzing"
          ? "GenLayer is tracing the signal..."
          : "Consensus-backed analysis complete"}
      </div>
    </motion.div>
  );
}
