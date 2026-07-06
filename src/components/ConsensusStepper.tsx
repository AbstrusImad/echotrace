import { motion } from "framer-motion";

type Stage =
  | "switching-network"
  | "awaiting-signature"
  | "waiting-consensus"
  | "reading-result"
  | "done";

type ConsensusStepperProps = {
  stage: Stage;
  txHash?: string;
  explorerBase: string;
};

const STEPS: { id: Stage; title: string; detail: string }[] = [
  { id: "switching-network", title: "Align network", detail: "Wallet on GenLayer Asimov" },
  { id: "awaiting-signature", title: "Sign request", detail: "Authorize the trace" },
  { id: "waiting-consensus", title: "Validator consensus", detail: "Nodes re-run the assessment" },
  { id: "reading-result", title: "Seal verdict", detail: "Reading result from chain" },
];

const ORDER: Stage[] = [
  "switching-network",
  "awaiting-signature",
  "waiting-consensus",
  "reading-result",
  "done",
];

export function ConsensusStepper({ stage, txHash, explorerBase }: ConsensusStepperProps) {
  const currentIndex = ORDER.indexOf(stage);

  return (
    <div className="consensus-stepper">
      <div className="stepper-header">
        <span className="stepper-kicker">Live on GenLayer</span>
        <h2>Tracing the signal</h2>
        <p>Every validator independently re-runs the assessment. Only the verdict they converge on is written on chain.</p>
      </div>

      <ol className="stepper-list">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={step.id}
              className={`stepper-item ${done ? "done" : ""} ${active ? "active" : ""}`}
            >
              <span className="stepper-node">
                {done ? (
                  <motion.svg
                    viewBox="0 0 24 24"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ) : active ? (
                  <motion.i
                    className="stepper-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <i className="stepper-idle" />
                )}
              </span>
              <div className="stepper-copy">
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </div>
              {i < STEPS.length - 1 && <span className="stepper-rail" />}
            </li>
          );
        })}
      </ol>

      {txHash && (
        <a
          className="ghost-link stepper-tx"
          href={`${explorerBase}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          Track transaction
        </a>
      )}
    </div>
  );
}
