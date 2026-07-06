import { motion } from "framer-motion";
import { ExamplePrompts } from "./ExamplePrompts";

type HeroInputProps = {
  query: string;
  isAnalyzing: boolean;
  walletAddress: string | null;
  walletError: string;
  onConnectWallet: () => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
};

const VERDICTS = [
  { label: "Organic", tone: "green" },
  { label: "Artificial Hype", tone: "magenta" },
  { label: "Coordinated", tone: "amber" },
  { label: "Unclear", tone: "muted" },
];

export function HeroInput({
  query,
  isAnalyzing,
  walletAddress,
  walletError,
  onConnectWallet,
  onQueryChange,
  onSubmit,
}: HeroInputProps) {
  const canSubmit =
    query.trim().length > 2 && !isAnalyzing && Boolean(walletAddress);
  const buttonText = walletAddress
    ? query.trim().length > 2
      ? "Run analysis on chain"
      : "Describe a trend to begin"
    : "Connect wallet to start";

  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="hero-badge"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="hero-badge-dot" />
        Consensus-backed signal intelligence
      </motion.div>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      >
        Is the trend <span className="grad-organic">real</span>,
        <br /> or <span className="grad-hype">manufactured</span>?
      </motion.h1>

      <motion.p
        className="hero-sub"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        Describe any online trend. GenLayer validators independently assess its
        propagation and settle a verdict on chain, no single server decides.
      </motion.p>

      <motion.form
        className="hero-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (walletAddress && canSubmit) onSubmit();
        }}
      >
        <div className={`hero-input ${query ? "has-value" : ""}`}>
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="e.g. A new token trending with identical launch posts across many accounts in minutes"
            aria-label="Describe a trend to analyze"
            rows={3}
          />
          <span className="hero-input-glow" aria-hidden="true" />
        </div>

        <motion.button
          type={walletAddress ? "submit" : "button"}
          className="primary-button hero-cta"
          disabled={walletAddress ? !canSubmit : isAnalyzing}
          onClick={walletAddress ? undefined : onConnectWallet}
          whileHover={canSubmit || !walletAddress ? { scale: 1.02 } : undefined}
          whileTap={canSubmit || !walletAddress ? { scale: 0.98 } : undefined}
        >
          <span>{buttonText}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        {walletError && <p className="wallet-error">{walletError}</p>}
      </motion.form>

      <ExamplePrompts onSelect={onQueryChange} />

      <motion.div
        className="verdict-legend"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {VERDICTS.map((v) => (
          <span key={v.label} className={`legend-chip tone-${v.tone}`}>
            <i />
            {v.label}
          </span>
        ))}
      </motion.div>
    </motion.section>
  );
}
