import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { AnalysisResult, AnalysisVerdict } from "../types/analysis";

type AnalysisResultCardProps = {
  result: AnalysisResult;
  txHash?: string;
  explorerBase: string;
  onReset: () => void;
};

const verdictMeta: Record<
  AnalysisVerdict,
  { tone: string; label: string; glyph: string }
> = {
  Organic: { tone: "green", label: "Organic", glyph: "GROWTH" },
  "Artificial Hype": { tone: "magenta", label: "Artificial Hype", glyph: "INFLATED" },
  Coordinated: { tone: "amber", label: "Coordinated", glyph: "SYNCED" },
  Unclear: { tone: "muted", label: "Unclear", glyph: "MIXED" },
};

const ringColor: Record<AnalysisVerdict, string> = {
  Organic: "#22e6a8",
  "Artificial Hype": "#ff4d6d",
  Coordinated: "#ffb020",
  Unclear: "#7a8aa0",
};

function ConfidenceRing({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const mv = useMotionValue(0);
  const dash = useTransform(mv, (v) => `${(v / 100) * C} ${C}`);
  const label = useTransform(mv, (v) => `${Math.round(v)}`);
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: [0.2, 0.8, 0.2, 1] });
    return controls.stop;
  }, [value, mv]);

  return (
    <div className="confidence-ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ strokeDasharray: dash, filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="confidence-ring-center">
        <motion.strong>{label}</motion.strong>
        <span>confidence</span>
      </div>
    </div>
  );
}

export function AnalysisResultCard({
  result,
  txHash,
  explorerBase,
  onReset,
}: AnalysisResultCardProps) {
  const meta = verdictMeta[result.verdict];
  const color = ringColor[result.verdict];
  const validators = result.validatorResults ?? [];

  return (
    <motion.aside
      className={`result-card verdict-${result.verdict.replace(/\s+/g, "-")}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="result-head">
        <div className="result-head-left">
          <span className={`verdict-badge tone-${meta.tone}`}>
            <i className="verdict-dot" />
            Verdict
          </span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            {meta.label}
          </motion.h2>
          <span className="verdict-glyph">{meta.glyph}</span>
        </div>
        <ConfidenceRing value={result.confidence} color={color} />
      </div>

      <motion.p
        className="result-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {result.summary}
      </motion.p>

      <div className="result-section">
        <h3>Signals behind the call</h3>
        <div className="reason-grid">
          {result.reasons.slice(0, 4).map((reason, i) => (
            <motion.div
              key={reason}
              className="reason-chip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.06 }}
            >
              <i />
              <span>{reason}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {validators.length > 0 && (
        <div className="result-section">
          <h3>Validator consensus</h3>
          <div className="validator-list">
            {validators.map((v, i) => (
              <motion.div
                key={`${v.validator}-${i}`}
                className={`validator-row status-${v.status.toLowerCase()}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34 + i * 0.05 }}
              >
                <span className="validator-name">{v.validator}</span>
                <span className="validator-status">{v.status}</span>
                <p className="validator-reason">{v.reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="result-actions">
        {txHash && (
          <a
            className="ghost-link"
            href={`${explorerBase}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on-chain proof
          </a>
        )}
        <button type="button" className="secondary-button" onClick={onReset}>
          New trace
        </button>
      </div>
    </motion.aside>
  );
}
