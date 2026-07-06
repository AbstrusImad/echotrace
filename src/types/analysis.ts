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
};

export type AnalysisPhase = "idle" | "analyzing" | "result" | "error";
