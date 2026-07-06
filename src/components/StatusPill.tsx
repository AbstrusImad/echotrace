type StatusPillProps = {
  label: string;
  tone?: "cyan" | "green" | "amber" | "magenta" | "muted";
};

export function StatusPill({ label, tone = "cyan" }: StatusPillProps) {
  return <span className={`status-pill status-pill-${tone}`}>{label}</span>;
}
