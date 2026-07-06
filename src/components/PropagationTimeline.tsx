import { motion } from "framer-motion";
import type { AnalysisResult } from "../types/analysis";

type PropagationTimelineProps = {
  result?: AnalysisResult | null;
};

const loadingEvents = [
  { label: "Origin sampling", time: "T+00", intensity: 42, type: "origin" },
  { label: "Propagation scan", time: "T+18m", intensity: 68, type: "spread" },
  { label: "Consensus pass", time: "T+47m", intensity: 55, type: "echo" },
];

export function PropagationTimeline({ result }: PropagationTimelineProps) {
  const events = result?.timeline ?? loadingEvents;

  return (
    <div className="timeline" aria-label="Propagation timeline">
      {events.slice(0, 3).map((event, index) => (
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
