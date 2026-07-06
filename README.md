<div align="center">

# EchoTrace

### Consensus-backed signal intelligence on GenLayer

Is a trend growing on its own, or is someone manufacturing it? EchoTrace asks a
network of AI validators, not a single server, and settles the verdict on chain.

[Live app](https://echotrace-8ne.pages.dev/) ·
[Contract on explorer](https://explorer-asimov.genlayer.com/address/0x169a52D470f92B925f062c39A17Ea5be81b3cbdA) ·
[GenLayer Asimov Testnet](https://docs.genlayer.com)

</div>

---

## Table of contents

- [What it does](#what-it-does)
- [Why GenLayer](#why-genlayer)
- [How it works](#how-it-works)
- [Verdicts and signal metrics](#verdicts-and-signal-metrics)
- [Consensus design](#consensus-design)
- [Safety and abuse resistance](#safety-and-abuse-resistance)
- [Architecture](#architecture)
- [Contract API](#contract-api)
- [Data model](#data-model)
- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Project layout](#project-layout)
- [Deployment info](#deployment-info)
- [Disclaimer](#disclaimer)

---

## What it does

A user describes any public online trend in plain language. EchoTrace derives a
small set of bounded public aggregate signals from that description, submits them
to a GenLayer intelligent contract, and gets back a structured, on-chain verdict:

- a categorical classification (Organic, Artificial Hype, Coordinated, Unclear),
- a cautious confidence value,
- five interpretable signal metrics,
- the reasons behind the call,
- a propagation timeline,
- and the validator-consensus record that produced the result.

Every submitted trace and its verdict are stored on chain and can be read back
by anyone. There is no hidden off-chain database and no mock data in the UI.

## Why GenLayer

Deciding whether hype is authentic is a subjective, evidence-bound judgment. If a
single server made that call, it could be biased, bribed, or simply wrong, and no
one could audit it. GenLayer solves this with an **intelligent contract**: an LLM
runs *inside* a smart contract, and many independent validators re-run the same
assessment. The chain only records the outcome they converge on.

That means the verdict is:

- **Reproducible** - every validator runs the same prompt and rules.
- **Tamper-resistant** - one rogue node cannot force a result.
- **Auditable** - the query, signals, verdict, and validator votes live on chain.

## How it works

```
   User describes a trend
            |
            v
   Frontend derives bounded public aggregate signals
            |
            v
   submit_and_analyze(query, signals)   <-- wallet-signed tx on Asimov
            |
            v
   Leader LLM produces a structured assessment
            |
            v
   Validators independently re-run and vote (risk family + confidence + buckets)
            |
            v
   Deterministic backstops clamp, guard, and settle the verdict
            |
            v
   Verdict written on chain  -->  frontend reads and renders it
```

The frontend never fabricates a result. While consensus runs it shows a live
stepper and animated skeletons; once the verdict is on chain, real values animate
into place.

## Verdicts and signal metrics

**Verdicts**

| Verdict | Meaning |
| --- | --- |
| Organic | Diverse origins, gradual spread, low repetition, low coordination. |
| Artificial Hype | Narrow origin, high phrase repetition, velocity anomaly, low variation. |
| Coordinated | Multiple clusters activating in sync, repeated pathways, synchronized timing. |
| Unclear | Insufficient, mixed, unsafe, or inconclusive public signals. |

**Signal metrics (0-100)**

| Metric | What it captures |
| --- | --- |
| Origin diversity | How many distinct origins the spread has. |
| Phrase similarity | How repeated the wording is across posts. |
| Velocity anomaly | How abnormal the growth speed is. |
| Coordination index | How synchronized the clusters are. |
| Organic spread | How natural the propagation looks. |

The final verdict is settled deterministically from these metric profiles, so it
stays consistent with the numbers shown.

## Consensus design

- **Leader** runs a structured assessment prompt and returns a JSON design.
- **Validators** re-run the same prompt and agree only when the **risk family**
  matches, the **confidence** is within tolerance, and at least three of five
  **signal buckets** agree. Prose and exact numbers are treated as leader flavor,
  which keeps consensus reachable while anchoring on the categorical decision.
- **Deterministic backstops** then clamp every metric to 0-100, block prompt
  injection and unsafe intents, enforce a minimum evidence bar, and settle the
  final verdict from the metric profile before it is written on chain.

This anchoring is deliberate: comparing free-form LLM prose exactly would almost
always fail consensus, so EchoTrace compares the parts that must be stable.

## Safety and abuse resistance

Inputs are untrusted data, never instructions. The contract:

- ignores prompt-injection markers ("ignore previous", "system prompt", etc.),
- refuses blocked intents (doxxing, private data, bot creation, spam, astroturf,
  trend manipulation) and returns a safe Unclear verdict,
- never accuses real people or groups absolutely and uses hedged language,
- downgrades thin or low-evidence cases to Unclear,
- caps input sizes and clamps all numeric outputs.

## Architecture

```
+-------------------+        wallet-signed tx        +----------------------------+
|   React frontend  |  ----------------------------> |  EchoTrace intelligent     |
|  (Vite + TS)      |                                |  contract (Python)         |
|                   |  <---------------------------- |  on GenLayer Asimov        |
|  reads verdicts   |         read views             |                            |
+-------------------+                                +----------------------------+
        |                                                        |
        |  MetaMask (GenLayer Asimov, chain 61999)               |  LLM under
        v                                                        v  validator consensus
   User's browser                                          Deterministic backstops
```

The frontend owns presentation only. The contract owns the authoritative state.

## Contract API

Writes:

- `submit_trace(query, public_signals_json) -> trace_id` - store a pending trace.
- `analyze_trace(trace_id) -> result_json` - run consensus and settle the verdict.
- `submit_and_analyze(query, public_signals_json) -> result_json` - both in one tx.

Views:

- `get_trace(trace_id) -> json`
- `get_result(trace_id) -> json`
- `get_traces(start) -> json` - most recent traces, paged.
- `get_stats() -> json` - totals and engine info.

`public_signals_json` is a JSON array (up to 8) of bounded public observations:

```json
[
  {
    "sourceType": "public-query",
    "note": "Repeated launch phrase across several public posts",
    "observedAt": "T+18m",
    "intensity": 78
  }
]
```

## Data model

The analyzed result stored on chain and rendered by the UI:

```ts
type AnalysisResult = {
  verdict: "Organic" | "Artificial Hype" | "Coordinated" | "Unclear";
  confidence: number;              // 0-100
  summary: string;
  reasons: string[];
  signals: {
    originDiversity: number;
    phraseSimilarity: number;
    velocityAnomaly: number;
    coordinationIndex: number;
    organicSpread: number;
  };
  timeline: { label: string; time: string; intensity: number; type: string }[];
  validatorResults: { validator: string; status: string; reason: string }[];
};
```

## Tech stack

- **Contract**: GenLayer Python intelligent contract (`contracts/echotrace.py`)
- **Frontend**: React 19, TypeScript, Vite 7
- **Animation**: Framer Motion, plus a custom `<canvas>` signal-network field
- **Chain access**: `genlayer-js`
- **Wallet**: MetaMask-compatible, GenLayer Asimov (chain id 61999)
- **Hosting**: Cloudflare Pages

## Local development

Prerequisites: Node 18+ and a MetaMask-compatible wallet.

```bash
npm install
npm run dev       # start Vite dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build
```

Optional contract scripts (PowerShell, require the GenLayer CLI and a keystore):

```powershell
npm run genlayer:lint     # lint the contract
npm run deploy:asimov     # deploy to GenLayer Asimov
npm run genlayer:smoke    # submit a smoke-test trace
```

The frontend reads the contract address from `VITE_ECHOTRACE_CONTRACT_ADDRESS`
and falls back to the deployed address if it is not set. It never reads any
private key; end users sign with their own wallet.

## Deployment

The production build in `dist/` is deployed to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy dist --project-name echotrace --branch main
```

## Project layout

```
echotrace/
  contracts/
    echotrace.py            # GenLayer intelligent contract
  backend/
    README.md               # contract method reference
  scripts/                  # deploy / lint / smoke (PowerShell)
  deployments/
    asimov.json             # deployed address + tx
  src/
    components/
      SignalField.tsx       # animated signal-network canvas background
      SignalMap.tsx         # radar of the five signal metrics
      ConsensusStepper.tsx  # live consensus pipeline while analyzing
      AnalysisResultCard.tsx# verdict, confidence ring, validator consensus
      PropagationTimeline.tsx
      HeroInput.tsx
      ExamplePrompts.tsx
    lib/
      genlayerClient.ts     # all chain reads/writes
    types/
      analysis.ts
    App.tsx
    styles/global.css
  index.html
```

## Deployment info

| | |
| --- | --- |
| Network | GenLayer Asimov Testnet |
| Chain id | 61999 |
| Contract | `0x169a52D470f92B925f062c39A17Ea5be81b3cbdA` |
| Explorer | https://explorer-asimov.genlayer.com |
| Live app | https://echotrace-8ne.pages.dev/ |

## Disclaimer

EchoTrace analyzes public signal patterns and produces probabilistic assessments.
Results are not absolute proof and should not be used to accuse specific people or
organizations. The contract intentionally refuses unsafe requests and hedges its
language. Use it as a signal, not a verdict on real individuals.
