import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AnalysisResultCard } from "./components/AnalysisResultCard";
import { GlassPanel } from "./components/GlassPanel";
import { HeroInput } from "./components/HeroInput";
import { PropagationTimeline } from "./components/PropagationTimeline";
import { SignalMap } from "./components/SignalMap";
import { SignalParticles } from "./components/SignalParticles";
import { StatusPill } from "./components/StatusPill";
import {
  analyzeWithGenLayer,
  connectWallet,
  ECHOTRACE_CONTRACT_ADDRESS,
  GENLAYER_ASIMOV_EXPLORER,
  hasContractAddress,
} from "./lib/genlayerClient";
import type { AnalysisPhase, AnalysisResult } from "./types/analysis";

const WALLET_PERSISTENCE_KEY = "echotrace.wallet.connected";

export default function App() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(
    null,
  );
  const [walletError, setWalletError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [progressMessage, setProgressMessage] = useState(
    "Connect your wallet on GenLayer Asimov.",
  );

  const isAnalyzing = phase === "analyzing";

  const handleConnectWallet = async () => {
    setWalletError("");
    try {
      const account = await connectWallet();
      setWalletAddress(account);
      localStorage.setItem(WALLET_PERSISTENCE_KEY, "true");
      setProgressMessage("Wallet connected on GenLayer Asimov.");
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
        const accounts = await provider.request<string[]>({
          method: "eth_accounts",
        });
        const [account] = accounts;
        if (!cancelled && account) {
          setWalletAddress(account as `0x${string}`);
          setProgressMessage("Wallet connected on GenLayer Asimov.");
        }
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
        setProgressMessage("Wallet connected on GenLayer Asimov.");
      } else {
        setWalletAddress(null);
        localStorage.removeItem(WALLET_PERSISTENCE_KEY);
        setProgressMessage("Connect your wallet on GenLayer Asimov.");
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

    try {
      const analysis = await analyzeWithGenLayer(query.trim(), {
        walletAddress,
        onProgress: (progress, hash) => {
          if (hash) setTxHash(hash);
          if (progress === "switching-network") {
            setProgressMessage("Switching wallet to GenLayer Asimov...");
          }
          if (progress === "awaiting-signature") {
            setProgressMessage("Waiting for your wallet signature...");
          }
          if (progress === "waiting-consensus") {
            setProgressMessage("Transaction signed. Waiting for GenLayer consensus...");
          }
          if (progress === "reading-result") {
            setProgressMessage("Consensus accepted. Reading EchoTrace result...");
          }
        },
      });
      setResult(analysis);
      setProgressMessage("Analysis stored and read from GenLayer Asimov.");
      setPhase("result");
    } catch (error) {
      setWalletError(
        error instanceof Error ? error.message : "The transaction could not be completed.",
      );
      setPhase("error");
    }
  };

  const resetTrace = () => {
    setPhase("idle");
    setResult(null);
    setQuery("");
    setTxHash("");
    setProgressMessage(
      walletAddress
        ? "Wallet connected on GenLayer Asimov."
        : "Connect your wallet on GenLayer Asimov.",
    );
  };

  return (
    <main className="app-shell">
      <SignalParticles />
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>EchoTrace</span>
        </div>
        <div className="top-status">
          <StatusPill label="Asimov Signal Engine" />
          <button
            type="button"
            className="wallet-button"
            onClick={handleConnectWallet}
          >
            {walletAddress ? shortAddress(walletAddress) : "Connect Wallet"}
          </button>
          <a href="#about">About</a>
          <a href="#how">How it works</a>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            className="idle-stage"
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <HeroInput
              query={query}
              isAnalyzing={isAnalyzing}
              walletAddress={walletAddress}
              walletError={
                walletError ||
                (!hasContractAddress()
                  ? "Configure VITE_ECHOTRACE_CONTRACT_ADDRESS for Asimov."
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
            transition={{ duration: 0.55 }}
          >
            <div className="trace-main">
              <div className="trace-heading">
                <span>{query}</span>
                <h1>
                  {phase === "analyzing"
                    ? "GenLayer is tracing the signal..."
                    : "Propagation Pattern"}
                </h1>
              </div>
              <SignalMap phase={phase} result={result} />
            </div>

            <div className="trace-side">
              {phase === "result" && result ? (
                <AnalysisResultCard result={result} onReset={resetTrace} />
              ) : (
                <GlassPanel className="analysis-card">
                  <StatusPill label="Wallet-signed transaction" />
                  <h2>Signal scan active</h2>
                  <p>
                    {progressMessage}
                  </p>
                  {txHash && (
                    <a
                      className="tx-link"
                      href={`${GENLAYER_ASIMOV_EXPLORER}/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View transaction
                    </a>
                  )}
                </GlassPanel>
              )}
            </div>

            <PropagationTimeline phase={phase} result={result} />
          </motion.section>
        )}

        {phase === "error" && (
          <motion.section
            key="error"
            className="error-stage"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassPanel className="error-card">
              <StatusPill label="Trace interrupted" tone="magenta" />
              <h1>The analysis could not be completed.</h1>
              <p>{walletError || "Try another query."}</p>
              <button
                type="button"
                className="primary-button"
                onClick={resetTrace}
              >
                Try another trace
              </button>
            </GlassPanel>
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="app-footer" id="about">
        <p>
          EchoTrace analyzes public signal patterns. Results are probabilistic
          and should not be treated as absolute proof.
        </p>
        <p id="how">
          Contract {shortAddress(ECHOTRACE_CONTRACT_ADDRESS)} on GenLayer Asimov.
        </p>
      </footer>
    </main>
  );
}

function shortAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
