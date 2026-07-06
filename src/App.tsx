import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AnalysisResultCard } from "./components/AnalysisResultCard";
import { ConsensusStepper } from "./components/ConsensusStepper";
import { HeroInput } from "./components/HeroInput";
import { PropagationTimeline } from "./components/PropagationTimeline";
import { SignalField } from "./components/SignalField";
import { SignalMap } from "./components/SignalMap";
import {
  analyzeWithGenLayer,
  connectWallet,
  describeSubmitError,
  ECHOTRACE_CONTRACT_ADDRESS,
  GENLAYER_EXPLORER,
  hasContractAddress,
} from "./lib/genlayerClient";
import type { AnalysisPhase, AnalysisResult, AnalysisVerdict } from "./types/analysis";

const WALLET_PERSISTENCE_KEY = "echotrace.wallet.connected";

type Stage =
  | "switching-network"
  | "awaiting-signature"
  | "waiting-consensus"
  | "reading-result"
  | "done";

const fieldPalette: Record<AnalysisVerdict | "idle", string[]> = {
  idle: ["#38e1c8", "#2f80ff", "#8b5cf6"],
  Organic: ["#22e6a8", "#2dd4bf", "#00d9ff"],
  "Artificial Hype": ["#ff4d6d", "#d946ef", "#8b5cf6"],
  Coordinated: ["#ffb020", "#8b5cf6", "#2f80ff"],
  Unclear: ["#7a8aa0", "#2f80ff", "#00d9ff"],
};

export default function App() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null);
  const [walletError, setWalletError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [stage, setStage] = useState<Stage>("switching-network");

  const isAnalyzing = phase === "analyzing";

  const handleConnectWallet = async () => {
    setWalletError("");
    try {
      const account = await connectWallet();
      setWalletAddress(account);
      localStorage.setItem(WALLET_PERSISTENCE_KEY, "true");
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet failed.");
    }
  };

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    let cancelled = false;

    const restoreWallet = async () => {
      if (localStorage.getItem(WALLET_PERSISTENCE_KEY) !== "true") return;
      try {
        const accounts = await provider.request<string[]>({ method: "eth_accounts" });
        const [account] = accounts;
        if (!cancelled && account) setWalletAddress(account as `0x${string}`);
      } catch {
        localStorage.removeItem(WALLET_PERSISTENCE_KEY);
      }
    };

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      const [account] = accounts;
      if (account) {
        setWalletAddress(account as `0x${string}`);
        localStorage.setItem(WALLET_PERSISTENCE_KEY, "true");
      } else {
        setWalletAddress(null);
        localStorage.removeItem(WALLET_PERSISTENCE_KEY);
      }
    };

    void restoreWallet();
    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const runAnalysis = async () => {
    if (query.trim().length < 3 || !walletAddress || !hasContractAddress()) {
      if (!walletAddress) setWalletError("Connect your wallet first.");
      return;
    }

    setPhase("analyzing");
    setResult(null);
    setTxHash("");
    setWalletError("");
    setStage("switching-network");

    try {
      const analysis = await analyzeWithGenLayer(query.trim(), {
        walletAddress,
        onProgress: (progress, hash) => {
          if (hash) setTxHash(hash);
          setStage(progress as Stage);
        },
      });
      setResult(analysis);
      setStage("done");
      setPhase("result");
    } catch (error) {
      setWalletError(describeSubmitError(error));
      setPhase("error");
    }
  };

  const resetTrace = () => {
    setPhase("idle");
    setResult(null);
    setQuery("");
    setTxHash("");
    setStage("switching-network");
  };

  const fieldColors = useMemo(() => {
    if (phase === "result" && result) return fieldPalette[result.verdict];
    return fieldPalette.idle;
  }, [phase, result]);

  const fieldEnergy = phase === "analyzing" ? 2.1 : phase === "result" ? 1.4 : 1;

  return (
    <div className="app-shell">
      <SignalField colors={fieldColors} energy={fieldEnergy} />
      <div className="app-vignette" aria-hidden="true" />

      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="4" fill="currentColor" />
              <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.28" />
            </svg>
          </span>
          <span className="brand-name">EchoTrace</span>
        </div>
        <div className="top-status">
          <span className="net-badge">
            <i className="net-dot" />
            GenLayer Bradbury
          </span>
          <button
            type="button"
            className={`wallet-button ${walletAddress ? "connected" : ""}`}
            onClick={handleConnectWallet}
          >
            {walletAddress ? (
              <>
                <i className="wallet-dot" />
                {shortAddress(walletAddress)}
              </>
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
            >
              <HeroInput
                query={query}
                isAnalyzing={isAnalyzing}
                walletAddress={walletAddress}
                walletError={
                  walletError ||
                  (!hasContractAddress()
                    ? "Configure VITE_ECHOTRACE_CONTRACT_ADDRESS for Bradbury."
                    : "")
                }
                onConnectWallet={handleConnectWallet}
                onQueryChange={setQuery}
                onSubmit={runAnalysis}
              />
            </motion.div>
          )}

          {(phase === "analyzing" || phase === "result") && (
            <motion.section
              key="trace"
              className="trace-stage"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.5 }}
            >
              <div className="trace-query">
                <span className="trace-query-label">Analyzing trend</span>
                <p>{query}</p>
              </div>

              <div className="trace-grid">
                <div className="trace-timeline-col">
                  <PropagationTimeline phase={phase} result={result} />
                </div>
                <div className="trace-map-col">
                  <SignalMap phase={phase} result={result} />
                </div>
                <div className="trace-side-col">
                  {phase === "result" && result ? (
                    <AnalysisResultCard
                      result={result}
                      txHash={txHash}
                      explorerBase={GENLAYER_EXPLORER}
                      onReset={resetTrace}
                    />
                  ) : (
                    <ConsensusStepper
                      stage={stage}
                      txHash={txHash}
                      explorerBase={GENLAYER_EXPLORER}
                    />
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {phase === "error" && (
            <motion.section
              key="error"
              className="error-stage"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="error-card">
                <span className="verdict-badge tone-magenta">
                  <i className="verdict-dot" />
                  Trace interrupted
                </span>
                <h1>The analysis could not be completed.</h1>
                <p>{walletError || "Try another query."}</p>
                <button type="button" className="primary-button" onClick={resetTrace}>
                  Try another trace
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <p>
          EchoTrace analyzes public signal patterns. Results are probabilistic
          and are not absolute proof.
        </p>
        <a
          href={`${GENLAYER_EXPLORER}/address/${ECHOTRACE_CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="footer-contract"
        >
          Contract {shortAddress(ECHOTRACE_CONTRACT_ADDRESS)} · GenLayer Bradbury
        </a>
      </footer>
    </div>
  );
}

function shortAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
