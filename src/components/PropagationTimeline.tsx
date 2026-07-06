import { motion } from "framer-motion";
import type { AnalysisResult } from "../types/analysis";

type PropagationTimelineProps = {
  phase: "analyzing" | "result";
  result?: AnalysisResult | null;
};

// While consensus runs there is no real timeline yet, so we render animated
// skeleton cards (pulsing, no fabricated labels or numbers) instead of mock
// data. The real timeline comes only from the on-chain result.
function SkeletonTimeline() {
  return (
    <div className="timeline" aria-label="Propagation timeline loading" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="timeline-card timeline-skeleton"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 * i }}
        >
          <motion.span
            className="skeleton-chip"
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
          <motion.span
            className="skeleton-bar"
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 + i * 0.15 }}
          />
          <div className="timeline-meter">
            <motion.i
              className="timeline-meter-scan"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PropagationTimeline({ phase, result }: PropagationTimelineProps) {
  if (phase !== "result" || !result) {
    return <SkeletonTimeline />;
  }

  const events = result.timeline.slice(0, 3);

  return (
    <div className="timeline" aria-label="Propagation timeline">
      {events.map((event, index) => (
        <motion.div
          key={`${event.label}-${event.time}`}
          className={`timeline-card timeline-${event.type}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 * index }}
        >
          <span>{event.time}</span>
          <strong>{event.label}</strong>
          <div className="timeline-meter">
            <motion.i
              initial={{ width: 0 }}
              animate={{ width: `${event.intensity}%` }}
              transition={{ duration: 0.9, delay: 0.2 + index * 0.1 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
