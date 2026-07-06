# EchoTrace GenLayer Backend

EchoTrace uses a GenLayer intelligent contract as the authoritative backend.

## Contract

- `contracts/echotrace.py`
- Network target: `testnet-bradbury`
- Contract address: `0xB6016107Bf89382AB7B2B65B9AB0b4624478c5d8`
- Deploy/test key env var: `GENLAYER_PRIVATE_KEY_0`

The frontend never reads `GENLAYER_PRIVATE_KEY_0`. End users connect their own
wallet and sign transactions in the browser on GenLayer Bradbury.

## Main Methods

- `submit_trace(query, public_signals_json)` stores a bounded public-signal assessment request.
- `analyze_trace(trace_id)` runs GenLayer consensus and stores the structured result.
- `submit_and_analyze(query, public_signals_json)` does both in one write.
- `get_trace(trace_id)`, `get_result(trace_id)`, `get_traces(start)`, `get_stats()` are views.

`public_signals_json` is a JSON array with up to 8 public aggregate observations:

```json
[
  {
    "sourceType": "social",
    "note": "Repeated launch phrase across several public posts",
    "observedAt": "T+18m",
    "intensity": 78
  }
]
```

The contract intentionally rejects or downgrades unsafe or inconclusive cases.
It does not support private data, doxxing, bots, spam, or trend manipulation.

## Local Commands

```powershell
& "C:\Program Files\nodejs\npm.cmd" run genlayer:lint
& "C:\Program Files\nodejs\npm.cmd" run deploy:bradbury
& "C:\Program Files\nodejs\npm.cmd" run genlayer:smoke
```

The deploy script loads `.env`, imports `GENLAYER_PRIVATE_KEY_0` into the local
GenLayer keystore, selects `testnet-bradbury`, and deploys the contract for
deployment/testing only.
