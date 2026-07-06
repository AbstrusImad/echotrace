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
      ? "Sign analysis on Asimov"
      : "Enter a trend to analyze"
    : "Connect Wallet";

  return (
    <motion.section
      className="hero-input-shell"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="hero-copy">
        <p className="eyebrow">GenLayer Signal Engine</p>
        <h1>Trace the origin of online hype</h1>
        <p className="hero-subtitle">
          Ask GenLayer to analyze whether a trend is organic, coordinated,
          artificial, or unclear.
        </p>
      </div>

      <form
        className="signal-input-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (walletAddress && canSubmit) onSubmit();
        }}
      >
        <div className="input-aura">
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="What should GenLayer analyze?"
            aria-label="What should GenLayer analyze?"
            rows={3}
          />
          <div className="input-rings" aria-hidden="true" />
        </div>
        <motion.button
          type={walletAddress ? "submit" : "button"}
          className="primary-button"
          disabled={walletAddress ? !canSubmit : isAnalyzing}
          onClick={walletAddress ? undefined : onConnectWallet}
          whileHover={canSubmit ? { scale: 1.025 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
        >
          {buttonText}
        </motion.button>
        {walletError && <p className="wallet-error">{walletError}</p>}
      </form>

      <ExamplePrompts onSelect={onQueryChange} />
    </motion.section>
  );
}
