import type { PropsWithChildren } from "react";

type GlassPanelProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return <div className={`glass-panel ${className}`}>{children}</div>;
}
