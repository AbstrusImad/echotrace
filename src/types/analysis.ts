export type AnalysisVerdict =
  | "Organic"
  | "Artificial Hype"
  | "Coordinated"
  | "Unclear";

export type TimelineEventType =
  | "origin"
  | "spread"
  | "burst"
  | "echo"
  | "organic";

export type AnalysisResult = {
  verdict: AnalysisVerdict;
  confidence: number;
  summary: string;
  reasons: string[];
  signals: {
    originDiversity: number;
    phraseSimilarity: number;
    velocityAnomaly: number;
    coordinationIndex: number;
    organicSpread: number;
  };
  timeline: {
    label: string;
    time: string;
    intensity: number;
    type: TimelineEventType;
  }[];
  validatorResults?: {
    validator: string;
    status: string;
    reason: string;
  }[];
};

export const SIGNAL_METRICS = [
  { key: "originDiversity", label: "Origin diversity", hint: "How many distinct origins the spread has" },
  { key: "phraseSimilarity", label: "Phrase similarity", hint: "How repeated the wording is across posts" },
  { key: "velocityAnomaly", label: "Velocity anomaly", hint: "How abnormal the growth speed is" },
  { key: "coordinationIndex", label: "Coordination index", hint: "How synchronized the clusters are" },
  { key: "organicSpread", label: "Organic spread", hint: "How natural the propagation looks" },
] as const;

export type SignalMetricKey = (typeof SIGNAL_METRICS)[number]["key"];

export type AnalysisPhase = "idle" | "analyzing" | "result" | "error";
