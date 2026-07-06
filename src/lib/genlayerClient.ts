import type { AnalysisResult } from "../types/analysis";
import { createClient } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import {
  ExecutionResult,
  TransactionHashVariant,
  TransactionStatus,
} from "genlayer-js/types";

declare global {
  interface Window {
    ethereum?: {
      request: <T = unknown>(request: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
      }) => Promise<T>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        listener: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

type PublicSignal = {
  sourceType: string;
  note: string;
  observedAt: string;
  intensity: number;
};

type TraceRecord = {
  traceId?: string;
  query?: string;
  requester?: string;
  status?: string;
  result?: AnalysisResult | null;
  createdIndex?: number;
  updatedIndex?: number;
};

type WalletRpcError = Error & {
  code?: number;
};

type GenLayerProgress =
  | "switching-network"
  | "awaiting-signature"
  | "waiting-consensus"
  | "reading-result";

export type AnalyzeOptions = {
  walletAddress: `0x${string}`;
  onProgress?: (progress: GenLayerProgress, txHash?: string) => void;
};

export const GENLAYER_ASIMOV_EXPLORER =
  "https://explorer-asimov.genlayer.com";

export const ECHOTRACE_CONTRACT_ADDRESS = (
  import.meta.env.VITE_ECHOTRACE_CONTRACT_ADDRESS ||
  "0x169a52D470f92B925f062c39A17Ea5be81b3cbdA"
) as `0x${string}`;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const readClient = createClient({
  chain: testnetAsimov,
});

export function hasContractAddress() {
  return ECHOTRACE_CONTRACT_ADDRESS !== ZERO_ADDRESS;
}

export async function connectWallet(): Promise<`0x${string}`> {
  const provider = window.ethereum;
  if (!provider) {
    throw new Error("Install MetaMask or a GenLayer-compatible wallet.");
  }

  const accounts = await provider.request<string[]>({
    method: "eth_requestAccounts",
  });
  const [account] = accounts;
  if (!account) {
    throw new Error("No connected account was found.");
  }

  await ensureAsimovNetwork();
  return account as `0x${string}`;
}

export async function analyzeWithGenLayer(
  query: string,
  options: AnalyzeOptions,
): Promise<AnalysisResult> {
  if (!hasContractAddress()) {
    throw new Error("Missing VITE_ECHOTRACE_CONTRACT_ADDRESS configuration.");
  }

  const provider = window.ethereum;
  if (!provider) {
    throw new Error("Connect a GenLayer-compatible wallet.");
  }

  options.onProgress?.("switching-network");
  await ensureAsimovNetwork();

  const writeClient = createClient({
    chain: testnetAsimov,
    account: options.walletAddress,
    provider,
  });

  options.onProgress?.("awaiting-signature");
  const txHash = await writeClient.writeContract({
    address: ECHOTRACE_CONTRACT_ADDRESS,
    functionName: "submit_and_analyze",
    args: [query, JSON.stringify(buildPublicSignals(query))],
    value: 0n,
  });

  options.onProgress?.("waiting-consensus", txHash);
  const receipt = await readClient.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 90,
  });

  if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw new Error(
      "The transaction was accepted, but the contract execution did not finish successfully.",
    );
  }

  options.onProgress?.("reading-result", txHash);
  const trace = await waitForAnalyzedTrace(
    query,
    options.walletAddress,
    (receipt as { sender?: string }).sender,
  );

  if (!trace?.result) {
    throw new Error(
      "The transaction succeeded, but the analyzed result was not readable yet. Please try again in a few seconds.",
    );
  }

  return trace.result;
}

async function ensureAsimovNetwork() {
  const provider = window.ethereum;
  if (!provider) return;

  const chainId = `0x${testnetAsimov.id.toString(16)}`;
  const currentChainId = await provider.request<string>({
    method: "eth_chainId",
  });

  if (currentChainId.toLowerCase() === chainId.toLowerCase()) {
    return;
  }

  const chainParams = {
    chainId,
    chainName: testnetAsimov.name,
    rpcUrls: [...testnetAsimov.rpcUrls.default.http],
    nativeCurrency: testnetAsimov.nativeCurrency,
    blockExplorerUrls: [testnetAsimov.blockExplorers?.default.url].filter(Boolean),
  };

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error) {
    const walletError = error as WalletRpcError;
    if (walletError.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  }
}

function buildPublicSignals(query: string): PublicSignal[] {
  const normalized = query.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const repetition = words.length
    ? Math.round(100 - (uniqueWords.size / words.length) * 100)
    : 0;
  const hasHypeTerms = /(airdrop|pump|moon|viral|launch|token|alpha|trending)/i.test(query);
  const hasCoordinationTerms = /(raid|campaign|bot|coordinated|same message|copy paste|spam)/i.test(query);

  return [
    {
      sourceType: "public-query",
      note: "User supplied a public trend description for on-chain assessment.",
      observedAt: "T+0m",
      intensity: clamp(42 + Math.min(words.length * 2, 24)),
    },
    {
      sourceType: "phrase-scan",
      note: "Client-side bounded scan estimated repeated wording pressure from the submitted text.",
      observedAt: "T+8m",
      intensity: clamp(30 + repetition + (hasHypeTerms ? 16 : 0)),
    },
    {
      sourceType: "coordination-hint",
      note: "Client-side bounded scan checked for public coordination vocabulary before contract consensus.",
      observedAt: "T+16m",
      intensity: clamp(28 + (hasCoordinationTerms ? 34 : 0) + (hasHypeTerms ? 8 : 0)),
    },
  ];
}

async function waitForAnalyzedTrace(
  query: string,
  walletAddress: `0x${string}`,
  receiptSender?: string,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const tracesRaw = await readClient.readContract({
      address: ECHOTRACE_CONTRACT_ADDRESS,
      functionName: "get_traces",
      args: [0],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });

    const trace = findMatchingTrace(
      parseTraceList(tracesRaw),
      query,
      walletAddress,
      receiptSender,
    );
    if (trace?.result) return trace;

    await sleep(2500);
  }

  return null;
}

function parseTraceList(raw: unknown): TraceRecord[] {
  if (Array.isArray(raw)) {
    return raw as TraceRecord[];
  }

  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? (parsed as TraceRecord[]) : [];
  } catch {
    return [];
  }
}

function findMatchingTrace(
  traces: TraceRecord[],
  query: string,
  walletAddress: `0x${string}`,
  receiptSender?: string,
) {
  const cleanQuery = query.trim();
  const candidates = traces
    .filter((trace) => trace.status === "ANALYZED" && trace.result)
    .sort((a, b) => Number(b.createdIndex ?? 0) - Number(a.createdIndex ?? 0));
  const requesters = new Set(
    [walletAddress, receiptSender].filter(Boolean).map((value) => value!.toLowerCase()),
  );

  return (
    candidates.find(
      (trace) =>
        trace.query === cleanQuery &&
        Boolean(trace.requester && requesters.has(trace.requester.toLowerCase())),
    ) ||
    candidates.find((trace) => trace.query === cleanQuery) ||
    candidates[0]
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
