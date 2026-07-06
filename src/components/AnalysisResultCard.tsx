import { motion } from "framer-motion";
import type { AnalysisResult } from "../types/analysis";
import { GlassPanel } from "./GlassPanel";
import { StatusPill } from "./StatusPill";

type AnalysisResultCardProps = {
  result: AnalysisResult;
  onReset: () => void;
};

const toneByVerdict = {
  Organic: "green",
  "Artificial Hype": "magenta",
  Coordinated: "amber",
  Unclear: "muted",
} as const;

export function AnalysisResultCard({
  result,
  onReset,
}: AnalysisResultCardProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <GlassPanel className={`result-card verdict-${result.verdict}`}>
        <div className="result-card-top">
          <StatusPill
            label="Analyzed by GenLayer"
            tone={toneByVerdict[result.verdict]}
          />
          <span className="confidence">{result.confidence}% confidence</span>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {result.verdict}
        </motion.h2>
        <p>{result.summary}</p>
        <div className="reason-list">
          {result.reasons.slice(0, 4).map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
        <button type="button" className="secondary-button" onClick={onReset}>
          New trace
        </button>
      </GlassPanel>
    </motion.aside>
  );
}
