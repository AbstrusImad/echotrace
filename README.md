# EchoTrace

EchoTrace is a GenLayer dApp that assesses whether a public online trend appears
Organic, Artificial Hype, Coordinated, or Unclear. A user submits a bounded trend
description; the frontend derives bounded public aggregate signals and sends them
to an intelligent contract on GenLayer, where an LLM adjudicator runs under
validator consensus and deterministic backstops settle the final verdict on chain.

The result is authoritative on chain, not a single-server opinion: GenLayer
validators independently re-run the same structured assessment and only the
verdict they converge on is recorded.

## Live

- App: https://echotrace-8ne.pages.dev/
- Network: GenLayer Asimov Testnet
- Contract: `0x169a52D470f92B925f062c39A17Ea5be81b3cbdA`
- Explorer: https://explorer-asimov.genlayer.com

## Stack

- Contract: `contracts/echotrace.py` (GenLayer Python intelligent contract)
- Frontend: React + Vite + TypeScript + Framer Motion
- Wallet: user-signed transactions on GenLayer Asimov (MetaMask compatible)

## What is on chain

- Every submitted trace (query + bounded public signals + requester)
- The structured verdict for each analyzed trace (verdict, confidence, summary,
  reasons, signal metrics, timeline, validator results)

There are no mocks. Everything the UI shows is read from the deployed contract.

## Development

```powershell
npm install
npm run dev
```

Contract deploy and smoke scripts live in `scripts/`. See `backend/README.md`
for the contract method reference.

## Safety

Inputs are untrusted. The contract rejects or downgrades unsafe or inconclusive
requests and does not support private data, doxxing, bots, spam, or trend
manipulation. Results are probabilistic and are not absolute proof.
