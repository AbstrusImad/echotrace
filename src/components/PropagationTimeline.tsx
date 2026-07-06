import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { AnalysisResult } from "../types/analysis";

type PropagationTimelineProps = {
  phase: "analyzing" | "result";
  result?: AnalysisResult | null;
};

function IntensityBar({ value, delay }: { value: number; delay: number }) {
  const mv = useMotionValue(0);
  const label = useTransform(mv, (v) => `${Math.round(v)}%`);
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] });
    return controls.stop;
  }, [value, delay, mv]);
  return (
    <div className="timeline-meter">
      <motion.i
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.span className="timeline-meter-num">{label}</motion.span>
    </div>
  );
}

function SkeletonTimeline() {
  return (
    <div className="timeline" aria-label="Propagation timeline loading" aria-busy="true">
      <span className="timeline-title">Propagation timeline</span>
      <div className="timeline-track">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="timeline-card timeline-skeleton"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i }}
          >
            <span className="timeline-node" />
            <motion.span
              className="skeleton-chip"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
            <motion.span
              className="skeleton-bar"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 + i * 0.15 }}
            />
            <div className="timeline-meter">
              <motion.i
                className="timeline-meter-scan"
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function PropagationTimeline({ phase, result }: PropagationTimelineProps) {
  if (phase !== "result" || !result) return <SkeletonTimeline />;

  const events = result.timeline.slice(0, 3);

  return (
    <div className="timeline" aria-label="Propagation timeline">
      <span className="timeline-title">Propagation timeline</span>
      <div className="timeline-track">
        {events.map((event, index) => (
          <motion.div
            key={`${event.label}-${event.time}`}
            className={`timeline-card timeline-${event.type}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * index }}
          >
            <span className="timeline-node" />
            <span className="timeline-time">{event.time}</span>
            <strong className="timeline-label">{event.label}</strong>
            <IntensityBar value={event.intensity} delay={0.2 + index * 0.1} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
