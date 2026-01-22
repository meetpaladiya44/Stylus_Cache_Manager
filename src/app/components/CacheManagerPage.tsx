"use client";
import "../css/Landing.css";
import { keyframes } from "@emotion/react";
import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import {
  getContract,
  getProvider,
  getNetworkKeyByChainId,
} from "@/utils/CacheManagerUtils";
import { useRouter } from "next/navigation";
import ConfigureAIModal from "./ConfigureAIModal ";
import { toast, Toaster } from "react-hot-toast";
import { cacheManagerConfig } from "@/config/CacheManagerConfig";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import CacheAnalyticsCards from "./ui/CacheAnalyticsCards";
import CacheSavingsAnalysis from "./ui/CacheSavingsAnalysis";
import CacheEntriesTable from "./ui/CacheEntriesTable";
import CacheSizeDistributionChart from "./ui/CacheSizeDistributionChart";
import ContractEntriesChart from "./ui/ContractEntriesChart";
import MinBidChart from "./ui/MinBidChart";
import PlaceBidForm from "./ui/PlaceBidForm";
import FetchSmallestEntries from "./ui/FetchSmallestEntries";
import { getCacheSize } from "@/utils/CacheManagerUtils";
import { getDecay } from "@/utils/CacheManagerUtils";
import { getQueueSize } from "@/utils/CacheManagerUtils";
import { getIsPaused } from "@/utils/CacheManagerUtils";
import { getEntries } from "@/utils/CacheManagerUtils";

const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Add this to your existing styles or create a new styles object
const styles = {
  fadeInDown: {
    animation: `${fadeInDown} 0.5s ease-out`,
  },
};

type RawEntry = [string, number, number]; // [codeHash, size, ethBid]
type FormattedEntry = {
  codeHash: string | any;
  size: number | any;
  ethBid: number | any;
};
interface Props {
  entriesCount: number;
  firstEntryDate: string; // ISO date string
}

import { DashboardData } from "../../../types";
import CacheManagerHeader from "./ui/CacheManagerHeader";
import { usePrivy } from "@privy-io/react-auth";

type FullDashboardData = DashboardData & {
  recentPredictions: Array<{
    timestamp: string;
    prediction: string;
    confidence: number;
    action: string;
  }>;
  decayData: Array<{
    time: string;
    decayRate: number;
    predictedDecay: number;
  }>;
  contractParams: {
    minBid: number;
    timeLeft: string;
    currentBid: number;
    evictionThreshold: number;
    userStake: number;
  };
  evictionRiskFactors: Array<{
    factor: string;
    score: number;
  }>;
};

interface CacheManagerPageProps {
  networkKey?: "arbitrum_sepolia" | "arbitrum_one";
  onNetworkChange?: (network: "arbitrum_sepolia" | "arbitrum_one") => void;
}

// Add retry utility function at the top
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve: any) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Add contract call wrapper with validation
const safeContractCall = async (
  contract: any,
  methodName: string,
  args: any[] = [],
  defaultValue: any
): Promise<any> => {
  try {
    console.log(`🔍 Calling ${methodName} with args:`, args);

    const result = await retryWithBackoff(async () => {
      const method = contract[methodName]; // this is as same as contract.methodName as in object we can do this way also to call the read function of the contract
      if (!method) {
        throw new Error(`Method ${methodName} not found on contract`);
      }

      const response = await method(...args);

      // Validate response
      if (response === null || response === undefined) {
        throw new Error(`Method ${methodName} returned null/undefined`);
      }

      // Check if response is empty bytes (0x)
      if (typeof response === 'string' && response === '0x') {
        throw new Error(`Method ${methodName} returned empty data (0x)`);
      }

      return response;
    });

    console.log(`✅ ${methodName} successful:`, result);
    return result;
  } catch (error: any) {
    console.error(`❌ ${methodName} failed:`, error.message);

    // Log specific error details for debugging
    if (error.message.includes('could not decode result data')) {
      console.error(`🔍 Decode error details:`, {
        method: methodName,
        args,
        error: error.message,
        code: error.code
      });
    }

    return defaultValue;
  }
};

const CacheManagerPage = ({ networkKey = "arbitrum_sepolia", onNetworkChange }: CacheManagerPageProps) => {
  // Check if wallet is connected - keep this at the top with other hooks
  const { authenticated: isConnected, ready: privyReady } = usePrivy();
  const publicClient = usePublicClient();
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Wait for Privy to be ready before determining connection status
  useEffect(() => {
    if (privyReady) {
      setIsAuthInitialized(true);
    }
  }, [privyReady]);

  // console.log("isConnected: ", isConnected);
  // console.log("privyReady: ", privyReady);
  // console.log("isAuthInitialized: ", isAuthInitialized);

  // All state hooks must be called unconditionally
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSmallestEntries, setFetchingSmallestEntries] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [decay, setDecay] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [minBid, setMinBid] = useState<any>(null);
  const [minBidParam, setMinBidParam] = useState("");
  const [smallestEntries, setSmallestEntries] = useState<any[]>([]);
  const [smallestEntriesCount, setSmallestEntriesCount] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [entriesCount, setEntriesCount] = useState(0);
  const [contractAddress, setContractAddress] = useState("");
  const [bidAmount, setBidAmount] = useState<any>("");
  const [queueSize, setQueueSize] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
  const [addressError, setAddressError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(
    null
  );
  const [gasAnalysisData, setGasAnalysisData] = useState({
    totalGasWithoutCache: 0,
    totalGasWithCache: 0,
    totalGasSaved: 0,
  });
  const [loadingGasAnalysis, setLoadingGasAnalysis] = useState(false);
  const [programAddresses, setProgramAddresses] = useState<string[]>([]);
  const [lastFetchedBlock, setLastFetchedBlock] = useState<bigint | null>(null);
  const [isIncrementalUpdate, setIsIncrementalUpdate] = useState(false);

  const [timeSeriesData, setTimeSeriesData] = useState([
    { timestamp: "00:00", cacheSize: 50, entries: 5, minBid: 0.1 },
    { timestamp: "04:00", cacheSize: 60, entries: 7, minBid: 0.15 },
    { timestamp: "08:00", cacheSize: 75, entries: 10, minBid: 0.2 },
    { timestamp: "12:00", cacheSize: 65, entries: 8, minBid: 0.18 },
    { timestamp: "16:00", cacheSize: 80, entries: 12, minBid: 0.25 },
    { timestamp: "20:00", cacheSize: 70, entries: 9, minBid: 0.22 },
  ]);

  const [hitRate, setHitRate] = useState(85.5);
  const [metrics, setMetrics] = useState({
    queueSize: 15,
    cacheSize: 100,
    contractCount: 25,
    decayRate: 0.05,
  });
  const [bidForm, setBidForm] = useState({
    address: "",
    amount: "",
    isPaused: false,
    minBid: null,
  });
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState("");

  const router = useRouter();

  const COLORS = ["#0088FE", "#00C49F"];
  const config = cacheManagerConfig[networkKey];

  // Cache management constants - network-specific cache keys
  const CACHE_KEY_PROGRAM_DATA = `cache_program_data_v3_${networkKey}`;
  const CACHE_KEY_GAS_ANALYSIS = `cache_gas_analysis_v3_${networkKey}`;
  const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  const INCREMENTAL_UPDATE_INTERVAL = 60 * 1000; // 1 minute for live updates

  // ARB_WASM precompile configuration
  const ARB_WASM_ADDRESS = "0x0000000000000000000000000000000000000071";
  const ARB_WASM_ABI = [
    {
      type: "function",
      name: "programInitGas",
      inputs: [
        {
          name: "program",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "gas",
          type: "uint64",
          internalType: "uint64",
        },
        {
          name: "gasWhenCached",
          type: "uint64",
          internalType: "uint64",
        },
      ],
      stateMutability: "view",
    },
  ];

  // Helper function for validating Ethereum addresses
  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Add this transformation function
  const formatEntries = (entries: RawEntry[]): FormattedEntry[] => {
    return entries.map((entry) => ({
      codeHash: entry[0],
      size: BigInt(entry[1]),
      ethBid: entry[2],
    }));
  };

  // Cache management functions
  const getCachedProgramData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PROGRAM_DATA);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(CACHE_KEY_PROGRAM_DATA);
        return null;
      }

      return {
        programAddresses: data.programAddresses,
        lastFetchedBlock: BigInt(data.lastFetchedBlock),
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error("Error reading program data cache:", error);
      return null;
    }
  };

  const setCachedProgramData = (addresses: string[], latestBlock: bigint) => {
    try {
      const data = {
        programAddresses: addresses,
        lastFetchedBlock: latestBlock.toString(),
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY_PROGRAM_DATA, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving program data cache:", error);
    }
  };

  const getCachedGasAnalysis = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_GAS_ANALYSIS);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(CACHE_KEY_GAS_ANALYSIS);
        return null;
      }

      return data.gasAnalysisData;
    } catch (error) {
      console.error("Error reading gas analysis cache:", error);
      return null;
    }
  };

  const setCachedGasAnalysis = (gasData: typeof gasAnalysisData) => {
    try {
      const data = {
        gasAnalysisData: gasData,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY_GAS_ANALYSIS, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving gas analysis cache:", error);
    }
  };

  // Function to get program initialization gas costs
  const getProgramInitGas = async (contractAddress: string) => {
    if (!isValidEthAddress(contractAddress)) {
      throw new Error("Invalid contract address");
    }

    const provider = await getProvider();
    const arbWasm = new ethers.Contract(
      ARB_WASM_ADDRESS,
      ARB_WASM_ABI,
      provider
    );

    try {
      const [gas, gasWhenCached] = await arbWasm.programInitGas(
        contractAddress
      );
      return {
        gas: gas,
        gasWhenCached: gasWhenCached,
        gasSavings: gas - gasWhenCached,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes("execution reverted")) {
        throw new Error(`Contract ${contractAddress} is not a valid Stylus contract or doesn't exist`);
      } else if (error.message.includes("CALL_EXCEPTION")) {
        throw new Error(`Failed to call programInitGas for ${contractAddress}: Contract may not be deployed or accessible`);
      } else {
        console.error(
          `Failed to get program init gas for ${contractAddress}:`,
          error
        );
        throw error;
      }
    }
  };

  // Function to fetch events in chunks to avoid RPC limits
  const fetchEventsInChunks = async (
    fromBlock: bigint,
    toBlock: bigint,
    chunkSize = 10000
  ) => {
    const allLogs: any[] = [];
    let currentBlock = fromBlock;
    let chunkCount = 0;
    const totalChunks = Math.ceil(
      Number(toBlock - fromBlock + BigInt(1)) / chunkSize
    );

    console.log(
      `📦 Fetching events in ${totalChunks} chunks of ${chunkSize} blocks each`
    );

    while (currentBlock <= toBlock) {
      const chunkEnd =
        currentBlock + BigInt(chunkSize - 1) > toBlock
          ? toBlock
          : currentBlock + BigInt(chunkSize - 1);
      chunkCount++;

      console.log(
        `📦 Chunk ${chunkCount}/${totalChunks}: blocks ${currentBlock} to ${chunkEnd}`
      );
      toast.loading(
        `Scanning chunk ${chunkCount}/${totalChunks} (blocks ${currentBlock.toString()} to ${chunkEnd.toString()})...`,
        { id: `chunk-scan-${chunkCount}` }
      );

      try {
        const chunkLogs = await publicClient!.getLogs({
          address: config.contracts.cacheManager.address as `0x${string}`,
          event: parseAbiItem(
            "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
          ),
          fromBlock: currentBlock,
          toBlock: chunkEnd,
        });

        console.log(`  📊 Found ${chunkLogs.length} events in this chunk`);
        allLogs.push(...chunkLogs);

        // Small delay to avoid overwhelming the RPC
        if (currentBlock < toBlock) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        console.warn(
          `⚠️ Failed to fetch chunk ${currentBlock} to ${chunkEnd}:`,
          error.message
        );
        // Continue with next chunk instead of failing completely
      }

      currentBlock = chunkEnd + BigInt(1);
    }

    return allLogs;
  };

  // Function to fetch only new events since last fetch (incremental update)
  const fetchIncrementalUpdates = async () => {
    if (!publicClient || !isConnected || !lastFetchedBlock) return [];

    try {
      const latestBlock = await retryWithBackoff(async () => {
        return await publicClient.getBlockNumber();
      });

      // Only fetch if there are new blocks
      if (latestBlock <= lastFetchedBlock) {
        console.log("📊 No new blocks since last fetch");
        return [];
      }

      console.log(
        `🔄 Incremental update: fetching events from block ${lastFetchedBlock + BigInt(1)
        } to ${latestBlock}`
      );

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));

      const newLogs = await retryWithBackoff(async () => {
        return await publicClient.getLogs({
          address: config.contracts.cacheManager.address as `0x${string}`,
          event: parseAbiItem(
            "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
          ),
          fromBlock: lastFetchedBlock + BigInt(1),
          toBlock: latestBlock,
        });
      });

      setLastFetchedBlock(latestBlock);

      if (newLogs.length > 0) {
        console.log(
          `✅ Found ${newLogs.length} new events in incremental update`
        );

        // Extract new program addresses
        const newPrograms: string[] = Array.from(
          new Set(newLogs.map((log: any) => log.args?.program as string))
        );
        const existingPrograms = new Set(programAddresses);
        const trulyNewPrograms: string[] = newPrograms.filter(
          (addr: string) => !existingPrograms.has(addr)
        );

        if (trulyNewPrograms.length > 0) {
          console.log(
            `🆕 Found ${trulyNewPrograms.length} new program addresses:`,
            trulyNewPrograms
          );
          const updatedAddresses: string[] = [...programAddresses, ...trulyNewPrograms];
          setProgramAddresses(updatedAddresses);
          setCachedProgramData(updatedAddresses, latestBlock);

          // Update gas analysis with new programs
          await calculateGasAnalysis(updatedAddresses);

          toast.success(
            `Found ${trulyNewPrograms.length} new program addresses!`
          );
        } else {
          console.log("📊 New events found but no new program addresses");
        }
      }

      return newLogs;
    } catch (error: any) {
      console.error("❌ Error in incremental update:", error);

      // Handle rate limiting specifically
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn("⚠️ Rate limit hit during incremental update, will retry later");
        return [];
      }

      return [];
    }
  };

  // Function to fetch all InsertBid events and extract program addresses using Etherscan API
  // Note: This uses Etherscan API, so wallet connection is NOT required
  const fetchProgramAddresses = async (forceRefresh = false) => {
    try {
      setLoadingGasAnalysis(true);

      console.log(`🚀 Starting fetchProgramAddresses for network: ${networkKey} using Etherscan API`);
      console.log(`📋 Contract address: ${config.contracts.cacheManager.address}`);
      console.log(`🌐 Network: ${config.chainName}`);

      // Validate network configuration
      if (!config || !config.contracts || !config.contracts.cacheManager) {
        throw new Error(`Invalid network configuration for ${networkKey}`);
      }

      // Verify contract address is valid
      if (!config.contracts.cacheManager.address || config.contracts.cacheManager.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Invalid contract address for network ${networkKey}: ${config.contracts.cacheManager.address}`);
      }

      console.log(`✅ Network validation passed for ${networkKey}`);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedProgramData();
        const cachedGasData = getCachedGasAnalysis();

        if (cachedData && cachedGasData) {
          console.log(
            `✅ Using cached data: ${cachedData.programAddresses.length} addresses, last fetched at block ${cachedData.lastFetchedBlock}`
          );

          setProgramAddresses(cachedData.programAddresses);
          setGasAnalysisData(cachedGasData);
          setLastFetchedBlock(cachedData.lastFetchedBlock);

          setLoadingGasAnalysis(false);
          toast.success(
            `Loaded cached data: ${cachedData.programAddresses.length} programs`
          );
          return;
        }
      }

      console.log(
        forceRefresh
          ? "🔄 Force refresh: Fetching all InsertBid events using Etherscan API..."
          : "🔍 No cache found: Fetching InsertBid events using Etherscan API..."
      );

      // Import Etherscan API functions
      const { getContractLogs, getLatestBlockNumber } = await import("@/utils/EtherscanAPI");

      // Get the latest block number
      const latestBlock = await getLatestBlockNumber(networkKey);
      console.log(`📊 Latest block number: ${latestBlock}`);

      // Get InsertBid event logs using Etherscan API
      // InsertBid event signature: InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)
      const insertBidTopic = "0x" + ethers.id("InsertBid(bytes32,address,uint192,uint64)").slice(2);

      console.log(`🔍 Fetching InsertBid events with topic: ${insertBidTopic}`);
      toast.loading("Fetching contract events using Etherscan API...", { id: "etherscan-fetch" });

      const logs = await getContractLogs(
        networkKey,
        0, // from block
        latestBlock, // to block
        insertBidTopic // topic0 for InsertBid events
      );

      console.log(`📊 Found ${logs.length} InsertBid events`);

      if (logs.length === 0) {
        console.log("❌ No InsertBid events found");
        toast.error("No InsertBid events found. Make sure bids have been placed on this contract.");
        setProgramAddresses([]);
        setGasAnalysisData({
          totalGasWithoutCache: 0,
          totalGasWithCache: 0,
          totalGasSaved: 0,
        });
        return;
      }

      // Extract program addresses from logs
      const uniquePrograms: string[] = Array.from(
        new Set(
          logs.map((log: any) => {
            // Program address is in the second topic (topic1) for indexed parameters
            // or in the data field for non-indexed parameters
            try {
              // Try to decode the log data
              const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                ["address", "uint192", "uint64"], // program, bid, size
                log.data
              );
              return decoded[0]; // program address
            } catch (error) {
              console.warn("Failed to decode log:", log, error);
              return null;
            }
          }).filter(Boolean)
        )
      );

      console.log(`📋 Found ${uniquePrograms.length} unique program addresses:`);
      uniquePrograms.forEach((addr, index) => {
        console.log(`  ${index + 1}. ${addr}`);
      });

      setProgramAddresses(uniquePrograms);
      setLastFetchedBlock(BigInt(latestBlock));

      // Cache the program data
      setCachedProgramData(uniquePrograms, BigInt(latestBlock));

      // Filter out invalid addresses before gas analysis
      const validPrograms = uniquePrograms.filter(addr =>
        addr &&
        addr !== "0x0000000000000000000000000000000000000000" &&
        isValidEthAddress(addr)
      );

      if (validPrograms.length > 0) {
        console.log(`📋 Processing ${validPrograms.length} valid program addresses for gas analysis`);
        await calculateGasAnalysis(validPrograms);
      } else {
        console.log("ℹ️ No valid program addresses found for gas analysis");
        if (uniquePrograms.length > 0) {
          toast.error(`Found ${uniquePrograms.length} program addresses but none are valid for gas analysis`);
        } else {
          toast.error("No program addresses extracted from events");
        }
      }

      toast.success(`Found ${uniquePrograms.length} program addresses using Etherscan API!`, {
        id: "etherscan-fetch"
      });

    } catch (error: any) {
      console.error("❌ Error fetching program addresses:", error);
      toast.error(`Failed to fetch program addresses: ${error.message}`);
    } finally {
      setLoadingGasAnalysis(false);
    }
  };

  const fetchProgramAddressesWithProvider = async (forceRefresh = false, rpcType: "infura" | "alchemy" | "default" = "infura") => {
    if (!publicClient || !isConnected) return;

    try {
      setLoadingGasAnalysis(true);

      console.log(`🚀 Starting fetchProgramAddresses for network: ${networkKey} using ${rpcType.toUpperCase()} RPC`);
      console.log(`📋 Contract address: ${config.contracts.cacheManager.address}`);
      console.log(`🌐 Network: ${config.chainName}`);
      if (config.rpc && typeof config.rpc === 'object' && config.rpc[rpcType]) {
        console.log(`🔗 RPC URL: ${config.rpc[rpcType]}`);
      }
      if ('explorer' in config) {
        console.log(`🔍 Explorer: ${config.explorer}`);
      }

      // Validate network configuration
      if (!config || !config.contracts || !config.contracts.cacheManager) {
        throw new Error(`Invalid network configuration for ${networkKey}`);
      }

      // Verify contract address is valid
      if (!config.contracts.cacheManager.address || config.contracts.cacheManager.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Invalid contract address for network ${networkKey}: ${config.contracts.cacheManager.address}`);
      }

      console.log(`✅ Network validation passed for ${networkKey}`);

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedProgramData();
        const cachedGasData = getCachedGasAnalysis();

        if (cachedData && cachedGasData) {
          console.log(
            `✅ Using cached data: ${cachedData.programAddresses.length} addresses, last fetched at block ${cachedData.lastFetchedBlock}`
          );

          setProgramAddresses(cachedData.programAddresses);
          setGasAnalysisData(cachedGasData);
          setLastFetchedBlock(cachedData.lastFetchedBlock);

          // Start incremental update in background
          setTimeout(() => {
            setIsIncrementalUpdate(true);
            fetchIncrementalUpdates().finally(() =>
              setIsIncrementalUpdate(false)
            );
          }, 1000);

          setLoadingGasAnalysis(false);
          return;
        }
      }

      console.log(
        forceRefresh
          ? "🔄 Force refresh: Fetching all InsertBid events..."
          : "🔍 No cache found: Fetching InsertBid events from cache manager contract..."
      );
      console.log(
        `📍 Cache Manager Contract Address: ${config.contracts.cacheManager.address}`
      );

      // Get the latest block number with retry
      const latestBlock = await retryWithBackoff(async () => {
        return await publicClient.getBlockNumber();
      });
      console.log(`📊 Latest block number: ${latestBlock}`);

      let allLogs: any[] = [];

      // Strategy: Try optimal approaches first, fall back to chunking if needed
      console.log("🚀 Starting optimized event scan...");

      // Method 1: Try to get all events in one request first
      console.log(
        "🎯 Method 1: Attempting to fetch all events in single request..."
      );
      toast.loading("Attempting to fetch all contract events...", {
        id: "provider-scan",
      });

      try {
        // Smart optimization: Start from the first block that calls place bid function
        // Block 66207509 is the first block with placeBid calls
        const estimatedDeploymentBlock = BigInt(66207509);
        console.log(
          `🎯 Trying optimized range: ${estimatedDeploymentBlock} to ${latestBlock}`
        );

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try to get all events from estimated deployment to now
        allLogs = await retryWithBackoff(async () => {
          return await publicClient.getLogs({
            address: config.contracts.cacheManager.address as `0x${string}`,
            event: parseAbiItem(
              "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
            ),
            fromBlock: estimatedDeploymentBlock,
            toBlock: latestBlock,
          });
        });

        console.log(`📊 Found ${allLogs.length} events in optimized range`);

        // If we got events but suspect there might be more in earlier blocks, do a quick check
        if (allLogs.length > 0 && estimatedDeploymentBlock > BigInt(0)) {
          console.log(
            `🔍 Found ${allLogs.length} events in recent range, checking if there are older events...`
          );

          try {
            // Add delay before next request
            await new Promise(resolve => setTimeout(resolve, 1000));

            const olderLogs = await retryWithBackoff(async () => {
              return await publicClient.getLogs({
                address: config.contracts.cacheManager.address as `0x${string}`,
                event: parseAbiItem(
                  "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
                ),
                fromBlock: BigInt(0),
                toBlock: estimatedDeploymentBlock - BigInt(1),
              });
            });

            if (olderLogs.length > 0) {
              console.log(
                `✅ Found ${olderLogs.length} additional events in older blocks`
              );
              allLogs = [...olderLogs, ...allLogs];
            }
          } catch (olderError) {
            console.warn(
              "⚠️ Could not check older blocks, but found recent events"
            );
          }
        }

        console.log(
          `✅ Success! Found ${allLogs.length} events in single request`
        );
        toast.success(`Found ${allLogs.length} events in optimized scan!`, {
          id: "provider-scan",
        });
      } catch (error: any) {
        console.warn(
          "⚠️ Single request failed, trying chunked approach:",
          error.message
        );
        toast.loading("Single request failed, using chunked approach...", {
          id: "provider-scan",
        });

        // Method 2: Fall back to chunked scanning
        // console.log("🎯 Method 2: Using chunked scanning as fallback...");
        // allLogs = await fetchEventsInChunks(BigInt(0), latestBlock, 50000); // Larger chunks since we know it's one contract
      }

      // Combine and deduplicate all logs
      const uniqueLogs = allLogs.filter(
        (log: any, index: number, self: any[]) =>
          index ===
          self.findIndex(
            (l: any) =>
              l.transactionHash === log.transactionHash &&
              l.logIndex === log.logIndex
          )
      );

      console.log(
        `📊 Total unique InsertBid events found: ${uniqueLogs.length}`
      );
      toast.success(
        `Comprehensive scan complete! Found ${uniqueLogs.length} total events.`,
        { id: "provider-scan" }
      );

      if (uniqueLogs.length === 0) {
        console.log("❌ No InsertBid events found in entire blockchain");
        console.log(`🔍 Debug info:`);
        console.log(`   - Network: ${networkKey}`);
        console.log(`   - Contract: ${config.contracts.cacheManager.address}`);
        console.log(`   - Latest block: ${latestBlock}`);
        console.log(`   - Estimated deployment block: 66207509`);
        console.log(`   - Current RPC: ${rpcType.toUpperCase()}`);
        if ('rpc' in config) {
          console.log(`   - RPC: ${config.rpc}`);
        }

        // Trigger RPC fallback when no events are found
        if (rpcType === "infura") {
          console.log("🔄 No events found with Infura, trying Alchemy...");
          throw new Error("No InsertBid events found with Infura RPC - triggering fallback to Alchemy");
        } else if (rpcType === "alchemy") {
          console.log("🔄 No events found with Alchemy, trying Default...");
          throw new Error("No InsertBid events found with Alchemy RPC - triggering fallback to Default");
        } else {
          // If we're already using the default RPC and still no events, show error
          console.log("❌ No InsertBid events found with any RPC provider");
          // Error message handled by main fetchProgramAddresses function
          setProgramAddresses([]);
          setGasAnalysisData({
            totalGasWithoutCache: 0,
            totalGasWithCache: 0,
            totalGasSaved: 0,
          });
          return;
        }
      }

      // Extract unique program addresses and log them
      const uniquePrograms: string[] = Array.from(
        new Set(uniqueLogs.map((log: any) => log.args?.program as string))
      );
      console.log(
        `📋 Found ${uniquePrograms.length} unique program addresses:`
      );
      uniquePrograms.forEach((addr, index) => {
        console.log(`  ${index + 1}. ${addr}`);
      });

      // Also log the frequency of each program address
      const programFrequency = uniqueLogs.reduce(
        (acc: Record<string, number>, log: any) => {
          const program = log.args?.program as string;
          acc[program] = (acc[program] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.log("📊 Program address frequency:");
      Object.entries(programFrequency)
        .sort((a, b) => b[1] - a[1])
        .forEach(([addr, count], index) => {
          console.log(`  ${index + 1}. ${addr}: ${count} bids`);
        });

      setProgramAddresses(uniquePrograms);
      setLastFetchedBlock(latestBlock);

      // Cache the program data
      setCachedProgramData(uniquePrograms, latestBlock);

      if (uniquePrograms.length > 0) {
        await calculateGasAnalysis(uniquePrograms);
      } else {
        console.log("ℹ️ No program addresses found");
        // Error message handled by main fetchProgramAddresses function
      }
    } catch (error: any) {
      console.error("❌ Error fetching program addresses:", error);
      console.error(`🔍 Error details:`, {
        network: networkKey,
        contract: config.contracts.cacheManager.address,
        error: error.message,
        stack: error.stack
      });

      // Handle specific error types
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        toast.error("Rate limit exceeded. Please try again in a few minutes.");
      } else if (error.message.includes('CORS')) {
        toast.error("Network access issue. Please check your connection.");
      } else {
        // Error message handled by main fetchProgramAddresses function
      }

      // Re-throw the error to trigger fallback mechanism
      throw error;
    } finally {
      setLoadingGasAnalysis(false);
    }
  };

  // Function to calculate gas analysis for all program addresses
  const calculateGasAnalysis = async (addresses: string[]) => {
    try {
      console.log(
        `⚙️ Calculating gas analysis for ${addresses.length} programs...`
      );
      toast.loading(`Analyzing gas costs for ${addresses.length} programs...`, {
        id: "gas-analysis",
      });

      let totalGasWithoutCache = 0;
      let totalGasWithCache = 0;
      let successfulCalculations = 0;
      let failedCalculations: string[] = [];

      // Process addresses in batches to avoid overwhelming the network
      const batchSize = 3; // Reduced batch size for better reliability
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        console.log(
          `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            addresses.length / batchSize
          )}`
        );

        const results = await Promise.allSettled(
          batch.map(async (address) => {
            try {
              const gasData = await getProgramInitGas(address);
              totalGasWithoutCache += Number(gasData.gas);
              totalGasWithCache += Number(gasData.gasWhenCached);
              successfulCalculations++;
              return { success: true, address, gasData };
            } catch (error: any) {
              console.warn(
                `⚠️ Failed to get gas data for ${address}:`,
                error.message
              );
              failedCalculations.push(address);

              // Don't throw error for individual contract failures
              // This allows the batch to continue processing other contracts
              return { success: false, address, error: error.message };
            }
          })
        );

        // Log batch results
        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value.success) {
            console.log(`  ✓ ${batch[index]} - Success`);
          } else {
            console.log(`  ✗ ${batch[index]} - Failed`);
          }
        });

        // Update progress
        toast.loading(
          `Processed ${Math.min(i + batchSize, addresses.length)}/${addresses.length
          } programs...`,
          { id: "gas-analysis" }
        );

        // Small delay between batches
        if (i + batchSize < addresses.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      const totalGasSaved = totalGasWithoutCache - totalGasWithCache;

      const newGasData = {
        totalGasWithoutCache,
        totalGasWithCache,
        totalGasSaved,
      };

      setGasAnalysisData(newGasData);

      // Cache the gas analysis results
      setCachedGasAnalysis(newGasData);

      console.log(
        `🎉 Gas analysis complete! Processed ${successfulCalculations}/${addresses.length} programs`
      );
      console.log(
        `📊 Total gas without cache: ${totalGasWithoutCache.toLocaleString()}`
      );
      console.log(
        `📊 Total gas with cache: ${totalGasWithCache.toLocaleString()}`
      );
      console.log(`📊 Total gas saved: ${totalGasSaved.toLocaleString()}`);

      if (failedCalculations.length > 0) {
        console.log(
          `❌ Failed calculations for: ${failedCalculations.join(", ")}`
        );
      }

      if (successfulCalculations > 0) {
        toast.success(
          `Gas analysis complete! Successfully processed ${successfulCalculations}/${addresses.length} programs.`,
          { id: "gas-analysis" }
        );
      } else {
        toast.error("Failed to calculate gas data for any programs", {
          id: "gas-analysis",
        });
      }
    } catch (error: any) {
      console.error("❌ Error calculating gas analysis:", error);
      toast.error(`Failed to calculate gas analysis: ${error.message}`, {
        id: "gas-analysis",
      });
    }
  };

  // Reset state when network changes to ensure fresh data is displayed
  useEffect(() => {
    console.log(`🔄 Network changed to: ${networkKey}, resetting state...`);
    
    // Reset gas analysis state
    setGasAnalysisData({
      totalGasWithoutCache: 0,
      totalGasWithCache: 0,
      totalGasSaved: 0,
    });
    setProgramAddresses([]);
    setLastFetchedBlock(null);
    
    // Reset other cache-related state
    setEntries([]);
    setEntriesCount(0);
    setCacheSize(null);
    setDecay(null);
    setQueueSize(null);
    setIsPaused(false);
  }, [networkKey]);

  // All useEffect and other hooks must also be called unconditionally
  // Initial data fetch - fetches data regardless of wallet connection (read-only operations)
  useEffect(() => {
    // Only need Privy to be ready, wallet connection NOT required for reading data
    if (isAuthInitialized) {
      const initialize = async () => {
        try {
          console.log(`🚀 Initializing CacheManager for network: ${networkKey}`);
          toast.loading(`Loading ${networkKey === 'arbitrum_one' ? 'Arbitrum One' : 'Arbitrum Sepolia'} data...`, { id: "initialization" });

          // Validate network before making calls
          const config = cacheManagerConfig[networkKey];
          if (!config) {
            throw new Error(`Invalid network key: ${networkKey}`);
          }

          console.log(`📋 Using contract address: ${config.contracts.cacheManager.address}`);

          // Fetch all data using Etherscan API (doesn't require wallet connection)
          await fetchAllDataWithEtherscan();

          toast.success(`${networkKey === 'arbitrum_one' ? 'Arbitrum One' : 'Arbitrum Sepolia'} data loaded!`, {
            id: "initialization",
          });
        } catch (error: any) {
          console.error("❌ Initialization failed:", error);
          let errorMessage = "Failed to initialize cache data";

          if (error.message.includes('could not decode result data')) {
            errorMessage = "Network connection issue. Please try again.";
          } else if (error.message.includes('Invalid network key')) {
            errorMessage = "Unsupported network. Please switch to Arbitrum Sepolia or Arbitrum One.";
          }

          toast.error(errorMessage);
        }
      };

      initialize();
    }
  }, [isAuthInitialized, networkKey]); // Removed isConnected dependency - data fetching works without wallet

  // Function to fetch all data using Etherscan API
  const fetchAllDataWithEtherscan = async () => {
    console.log(`📡 Fetching all data using Etherscan API for ${networkKey}`);

    try {
      // Fetch regular contract data
      console.log(`🔄 Fetching regular contract data...`);
      await Promise.all([
        fetchEntries(false),
        fetchCacheSize(false),
        fetchDecay(false),
        fetchQueueSize(false),
        checkIsPaused(false)
      ]);

      console.log(`✅ Regular contract data fetched successfully`); 

      // Fetch program addresses and gas analysis
      console.log(`🔄 Fetching program addresses...`);
      await fetchProgramAddresses(false);

      console.log(`✅ All data fetched successfully using Etherscan API`);
    } catch (error: any) {
      console.error("❌ Error fetching data with Etherscan API:", error);
      throw error;
    }
  };

  // Set up periodic incremental updates for live data (only when wallet is connected)
  // Note: Incremental updates use publicClient which requires wallet connection
  useEffect(() => {
    // Only run incremental updates if wallet connected and we have initial data
    if (!isConnected || !isAuthInitialized || !lastFetchedBlock || !publicClient) return;

    const interval = setInterval(async () => {
      if (!isIncrementalUpdate && !loadingGasAnalysis) {
        console.log("🔄 Performing periodic incremental update...");
        setIsIncrementalUpdate(true);
        await fetchIncrementalUpdates();
        setIsIncrementalUpdate(false);
      }
    }, INCREMENTAL_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, isAuthInitialized, lastFetchedBlock, loadingGasAnalysis, isIncrementalUpdate, publicClient]);

  // Reset current page when entries per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [entriesPerPage]);

  const fetchCacheSize = async (showToast = true) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Fetching cache size for network: ${networkKey} using Etherscan API`);

      const size = await getCacheSize(networkKey);

      if (size && size !== '0') {
        setCacheSize(size.toString());
        console.log(`✅ Cache size set to: ${size}`);
      } else {
        console.log(`⚠️ Cache size returned 0, keeping previous value`);
      }
    } catch (error: any) {
      console.error("Error fetching cache size:", error);
      const errorMessage = showToast
        ? `Failed to fetch cache size: ${error?.message || error}`
        : "Error fetching cache size";
      if (showToast) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setContractAddress(address);

    if (!address) {
      setAddressError("Contract address is required");
    } else if (!isValidEthAddress(address)) {
      setAddressError("Invalid Ethereum address format");
    } else {
      setAddressError("");
    }
  };

  // Fetch Decay
  const fetchDecay = async (showToast = true) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Fetching decay for network: ${networkKey} using Etherscan API`);

      const decay = await getDecay(networkKey);

      if (decay && decay !== '0') {
        setDecay(decay.toString());
        console.log(`✅ Decay set to: ${decay}`);
      } else {
        console.log(`⚠️ Decay returned 0, keeping previous value`);
      }
    } catch (error: any) {
      console.error("Error fetching decay:", error);
      const errorMessage = showToast
        ? `Failed to fetch decay: ${error?.message || error}`
        : "Error fetching decay";
      if (showToast) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Queue Size
  const fetchQueueSize = async (showToast = true) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Fetching queue size for network: ${networkKey} using Etherscan API`);

      const size = await getQueueSize(networkKey);

      if (size && size !== '0') {
        setQueueSize(size.toString());
        console.log(`✅ Queue size set to: ${size}`);
      } else {
        console.log(`⚠️ Queue size returned 0, keeping previous value`);
      }
    } catch (error: any) {
      console.error("Error fetching queue size:", error);
      const errorMessage = showToast
        ? `Failed to fetch queue size: ${error?.message || error}`
        : "Error fetching queue size";
      if (showToast) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Paused
  const checkIsPaused = async (showToast = true) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Checking pause status for network: ${networkKey} using Etherscan API`);

      const paused = await getIsPaused(networkKey);

      setIsPaused(Boolean(paused));
      console.log(`✅ Pause status set to: ${paused}`);
    } catch (error: any) {
      console.error("Error checking pause status:", error);
      const errorMessage = showToast
        ? `Failed to check if paused: ${error?.message || error}`
        : "Error checking pause status";
      if (showToast) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatProxyResult = (proxyResult: any) => {
    // Convert BigInt to string to avoid JSON serialization issues
    const formatValue = (value: any) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };

    // Format a single entry into a named object
    const formatEntry = (entry: any) => {
      return {
        codeHash: formatValue(entry[0]),
        size: formatValue(entry[1]),
        bid: formatValue(entry[2]),
      };
    };

    // Check if the input is array-like (has numeric keys)
    if (
      Array.isArray(proxyResult) ||
      (typeof proxyResult === "object" && proxyResult !== null)
    ) {
      // Get all enumerable keys
      const keys = Object.keys(proxyResult);

      // If it's an array-like object with numeric keys
      if (keys.every((key: any) => !isNaN(key))) {
        // If it's a single entry (has only 3 elements)
        if (keys.length === 3) {
          return formatEntry(proxyResult);
        }
        // If it's an array of entries
        return keys.map((key) => {
          const entry = proxyResult[key];
          return formatEntry(entry);
        });
      }
    }

    // Return the value as is if it's not in the expected format
    return formatValue(proxyResult);
  };

  const fetchEntries = async (showToast = true) => {
    try {
      console.log(`🔄 Fetching entries for network: ${networkKey} using Etherscan API`);
      setIsLoading(true);

      const rawEntries = await getEntries(networkKey);

      console.log("Raw entries from Etherscan API:", rawEntries);

      // Format entries to match expected structure
      const formattedEntries = rawEntries.map((entry: any) => ({
        codeHash: entry.codeHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
        size: entry.size ? BigInt(entry.size) : BigInt(0),
        ethBid: entry.ethBid || "0",
        bid: entry.ethBid || "0" // Add bid field for compatibility
      }));

      const numberOfEntries = formattedEntries.length;
      setEntriesCount(numberOfEntries);
      setEntries(formattedEntries);

      console.log(`✅ Entries fetched successfully: ${numberOfEntries} entries`);
    } catch (error: any) {
      console.error("Error fetching entries:", error);
      const errorMessage = showToast
        ? `Failed to fetch entries: ${error?.message || error}`
        : "Error fetching entries";
      if (showToast) {
        toast.error(errorMessage);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return entries.map((entry: any, index: any) => ({
      index: index + 1, // Use index + 1 for x-axis
      codeHash: entry.codeHash ? entry.codeHash.slice(0, 6) + "..." : "Unknown",
      size: Number(entry.size || 0),
      bid: entry.bid ? Number(ethers.formatEther(entry.bid)) : 0,
    }));
  }, [entries]);

  const handlePlaceBid = async () => {
    try {
      setIsLoading(true);

      if (isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
        throw new Error("Bid amount must be greater than zero");
      }

      toast.loading("Placing bid...", { id: "place-bid" });

      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Get network information
      const network = await provider.getNetwork();
      const networkName = network.name === "arbitrum-sepolia" ? "arbitrum-sepolia" : "arbitrum-one";

      // Get contract instance for placing bid
      const contract = await getContract(networkKey);

      // Place the bid immediately
      const tx = await contract.placeBid(contractAddress, {
        value: ethers.parseEther(bidAmount).toString(),
        gasLimit: 3000000,
      });

      console.log(`Transaction sent: ${tx.hash}`);
      toast.loading("Waiting for transaction confirmation...", { id: "place-bid" });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.toString();

      if (receipt.status === 1) {
        // Get gas analysis after successful bid (synchronous for database storage)
        let gasSaved = "0";
        let gasWhenNotCached = "0";
        
        try {
          const arbWasmAddress = "0x0000000000000000000000000000000000000071";
          const arbWasmAbi = ["function programInitGas(address) view returns (uint64, uint64)"];
          const arbWasm = new ethers.Contract(arbWasmAddress, arbWasmAbi, provider);
          
          const [gas, gasWhenCached] = await arbWasm.programInitGas(contractAddress);
          gasWhenNotCached = gas.toString();
          gasSaved = (gas - gasWhenCached).toString();
          console.log(`Gas analysis: ${gas} → ${gasWhenCached} (saved: ${gasSaved})`);
        } catch (gasError: any) {
          console.log(`Could not get gas data: ${gasError.message}`);
        }

        // Store bid data in MongoDB (non-blocking)
        setTimeout(async () => {
          try {
            const bidData = {
              contractAddress,
              deployedBy: walletAddress,
              network: networkName,
              minBidRequired: "0.0",
              gasSaved,
              gasUsed,
              gasWhenNotCached,
              txHash: tx.hash
            };

            const response = await fetch("/api/bid", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(bidData),
            });

            if (response.ok) {
              console.log("Bid data stored successfully in MongoDB");
            } else {
              console.warn("Failed to store bid data in MongoDB");
            }
          } catch (dbError) {
            console.warn("Error storing bid data:", dbError);
          }
        }, 500);

        toast.success("Bid placed successfully!", { id: "place-bid" });

        // Clear form immediately
        setContractAddress("");
        setBidAmount("");

        // Optional: Refresh entries in background
        setTimeout(async () => {
          try {
            await fetchEntries(false); // Don't show toast for background refresh
          } catch (error) {
            console.log("Background entries refresh failed:", error);
          }
        }, 2000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error placing bid:", error);

      // Parse smart contract errors for user-friendly messages
      let errorMessage = "Error placing bid";

      const errorString = String(error);

      // Check for common smart contract error patterns
      if (errorString.includes("transaction execution reverted")) {
        errorMessage =
          "Failed to place bid: Transaction reverted by smart contract";
      } else if (errorString.includes("insufficient funds")) {
        errorMessage = "Failed to place bid: Insufficient funds";
      } else if (errorString.includes("user rejected")) {
        errorMessage = "Failed to place bid: Transaction rejected by user";
      } else if (errorString.includes("network")) {
        errorMessage = "Failed to place bid: Network error";
      } else if (errorString.includes("gas")) {
        errorMessage = "Failed to place bid: Gas estimation failed";
      } else if (error?.reason) {
        errorMessage = `Failed to place bid: ${error.reason}`;
      } else if (error?.message) {
        // For other errors, try to extract a meaningful part
        const message = error.message;
        if (message.length > 100) {
          errorMessage = "Failed to place bid: Contract execution failed";
        } else {
          errorMessage = `Failed to place bid: ${message}`;
        }
      }

      toast.error(errorMessage, { id: "place-bid" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmallestEntries = async (k: any) => {
    if (!k || isNaN(k) || parseInt(k) <= 0) {
      toast.error("Please enter a valid number greater than 0");
      return;
    }

    // Note: Uses direct RPC calls, wallet connection NOT required
    try {
      setFetchingSmallestEntries(true);
      toast.loading("Fetching smallest entries...", { id: "smallest-entries" });
      
      console.log(`🔄 Fetching ${k} smallest entries for network: ${networkKey}`);
      console.log(`📋 Contract address: ${config.contracts.cacheManager.address}`);
      console.log(`🌐 Network config:`, {
        chainId: config.chainId,
        chainName: config.chainName,
        rpc: config.rpc
      });

      const contractAddress = config.contracts.cacheManager.address as `0x${string}`;
      const contractABI = config.contracts.cacheManager.abi;
      
      console.log(`🔍 Calling getSmallestEntries(${k}) with args:`, [BigInt(k)]);

      let result: any = null;
      let lastError: any = null;

      // Strategy 2: Try with direct RPC using ethers if Strategy 1 failed
      if (!result || (Array.isArray(result) && result.length === 0)) {
        try {
          console.log(`⚙️ Strategy 2: Using ethers with direct RPC`);
          
          // Try different RPC endpoints
          const rpcUrls = [
            config.rpc.infura,
            config.rpc.alchemy, 
            config.rpc.default
          ].filter(Boolean);

          for (const rpcUrl of rpcUrls) {
            try {
              if (!rpcUrl) {
                console.warn(`⚠️ Skipping null/undefined RPC URL`);
                continue;
              }
              console.log(`🔍 Trying RPC: ${rpcUrl}`);
              const provider = new ethers.JsonRpcProvider(rpcUrl as string);
              const contract = new ethers.Contract(contractAddress, contractABI, provider);
              
              result = await retryWithBackoff(async () => {
                return await contract.getSmallestEntries(BigInt(k));
              }, 2, 1500);
              
              if (result && Array.isArray(result) && result.length > 0) {
                console.log(`✅ Strategy 2 SUCCESS with RPC ${rpcUrl}:`, result);
                break;
              }
            } catch (rpcError: any) {
              console.warn(`⚠️ RPC ${rpcUrl} failed:`, rpcError.message);
              lastError = rpcError;
            }
          }
        } catch (error: any) {
          console.warn(`⚠️ Strategy 2 failed:`, error.message);
          lastError = error;
        }
      }

      // Strategy 3: Try with different parameter types if still no result
      if (!result || (Array.isArray(result) && result.length === 0)) {
        try {
          console.log(`⚙️ Strategy 3: Trying with different parameter types`);
          
          if (publicClient) {
            // Try with regular number instead of BigInt
            result = await publicClient.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'getSmallestEntries',
              args: [parseInt(k)] // Try regular number
            });
            
            if (result && Array.isArray(result) && result.length > 0) {
              console.log(`✅ Strategy 3 SUCCESS with regular number:`, result);
            }
          }
        } catch (error: any) {
          console.warn(`⚠️ Strategy 3 failed:`, error.message);
          lastError = error;
        }
      }

      // Check if we got any results
      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.error(`❌ All strategies failed. Last error:`, lastError);
        throw new Error(`All RPC strategies failed. Contract may be empty or function unavailable. Last error: ${lastError?.message || 'Unknown'}`);
      }

      console.log(`✅ Final result:`, result);
      console.log(`📊 Result type:`, typeof result, 'Array:', Array.isArray(result));
      
      // Format the result for display
      const formattedEntries = Array.isArray(result) 
        ? result.map((entry: any, index: number) => {
            console.log(`📝 Processing entry ${index}:`, entry);
            
            // Handle different result formats
            if (Array.isArray(entry) && entry.length >= 3) {
              // Tuple format: [codeHash, size, bid]
              const codeHash = entry[0]?.toString() || '0x0';
              const size = entry[1]?.toString() || '0';
              const bid = entry[2]?.toString() || '0';
              return `Entry ${index + 1}: Hash: ${codeHash.slice(0, 10)}..., Size: ${size}, Bid: ${bid}`;
            } else if (entry && typeof entry === 'object' && entry.code) {
              // Object format: {code, size, bid}
              const codeHash = entry.code?.toString() || '0x0';
              const size = entry.size?.toString() || '0';
              const bid = entry.bid?.toString() || '0';
              return `Entry ${index + 1}: Hash: ${codeHash.slice(0, 10)}..., Size: ${size}, Bid: ${bid}`;
            } else {
              // Unknown format
              return `Entry ${index + 1}: ${JSON.stringify(entry)}`;
            }
          })
        : [`Result: ${JSON.stringify(result)}`];
      
      console.log(`✅ Formatted entries:`, formattedEntries);
      
      setSmallestEntries(formattedEntries);

      toast.success(`Fetched ${formattedEntries.length} smallest entries successfully!`, {
        id: "smallest-entries",
      });
    } catch (error: any) {
      console.error("❌ Error fetching smallest entries:", error);

      // Parse error for user-friendly message
      let errorMessage = "Error fetching smallest entries";
      const errorString = String(error);

      if (errorString.includes("returned no data") || errorString.includes("0x")) {
        errorMessage = "Contract returned no data. The cache might be empty or the function is not available on this network.";
      } else if (errorString.includes("execution reverted") || errorString.includes("revert")) {
        errorMessage = "Contract execution failed. The function may have validation errors or contract is paused.";
      } else if (errorString.includes("network") || errorString.includes("connection")) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      } else if (errorString.includes("CALL_EXCEPTION")) {
        errorMessage = "Contract call failed. Please verify the contract is deployed and accessible.";
      } else if (error?.message && error.message.length <= 200) {
        errorMessage = `Failed to fetch smallest entries: ${error.message}`;
      } else {
        errorMessage = "Unable to fetch smallest entries. Please try again later or check if the cache has entries.";
      }

      toast.error(errorMessage, { id: "smallest-entries" });
    } finally {
      setFetchingSmallestEntries(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedEntries = useMemo(() => {
    if (!sortColumn) return entries;
    return [...entries].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn])
        return sortDirection === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn])
        return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [entries, sortColumn, sortDirection]);

  const filteredEntries = useMemo(() => {
    return sortedEntries.filter(
      (entry: any) =>
        entry.codeHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.size.toString().includes(searchTerm) ||
        (entry.bid ? ethers.formatEther(BigInt(entry.bid)) : "0").includes(searchTerm)
    );
  }, [sortedEntries, searchTerm]);

  const pageCount = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const chartDataMinBid = useMemo(() => {
    const bids = entries.map((entry: any, index: any) => ({
      index: index + 1,
      codeHash: entry.codeHash.slice(0, 6) + "...",
      currentBid: entry.bid ? Number(ethers.formatEther(entry.bid)) : 0,
    }));

    // Calculate running minimum bid
    let minSoFar = Infinity;
    const withMinBid = bids.map((item) => {
      minSoFar = Math.min(minSoFar, item.currentBid);
      return {
        ...item,
        minBid: minSoFar,
        avgBid: (minSoFar + item.currentBid) / 2,
      };
    });

    return withMinBid;
  }, [entries]);

  // Calculate overall minimum bid for reference line
  const overallMinBid = Math.min(...chartData.map((item: any) => item.minBid));

  const chartDataCacheSize = useMemo(() => {
    let totalSize = 0;

    return entries.map((entry: any, index: any) => {
      const currentSize = Number(entry.size);
      totalSize += currentSize;

      return {
        index: index + 1,
        codeHash: entry.codeHash.slice(0, 10) + "...",
        currentSize: currentSize,
        averageSize: totalSize / (index + 1),
        cumulativeSize: totalSize,
      };
    });
  }, [entries]);

  // Calculate average size for reference
  const averageSize =
    chartDataCacheSize.length > 0
      ? chartDataCacheSize.reduce(
        (sum: any, item: any) => sum + item.currentSize,
        0
      ) / chartDataCacheSize.length
      : 0;

  const handleAskAI = () => {
    router.push("/ask-ai");
  };

  const handleDataUpdate = (newData: DashboardData) => {
    if (dashboardData) {
      setDashboardData((prev) => (prev ? { ...prev, ...newData } : null));
    }
  };

  function calculateCacheSavings(): number {
    const totalEntriesOfPlaceBid: any = entriesCount;
    const differenceOfGasEstimation = 12685;
    const bidValueInEth = 0.1;

    const result =
      totalEntriesOfPlaceBid * differenceOfGasEstimation - bidValueInEth;
    return Math.round(result);
  }

  // Dynamic cache data based on real gas analysis
  const cacheData = useMemo(() => {
    if (
      gasAnalysisData.totalGasSaved === 0 &&
      gasAnalysisData.totalGasWithCache === 0
    ) {
      // Show loading state or placeholder data
      return [
        { name: "Gas Saved", value: 0 },
        { name: "Gas Used With Cache", value: 0 },
      ];
    }

    return [
      { name: "Gas Saved", value: gasAnalysisData.totalGasSaved },
      { name: "Gas Used With Cache", value: gasAnalysisData.totalGasWithCache },
    ];
  }, [gasAnalysisData]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#27272a",
            color: "#fff",
            border: '1px solid #3f3f46',
          },
          success: {
            duration: 3000,
            style: {
              background: "#166534",
              border: '1px solid #15803d',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#991b1b",
              border: '1px solid #dc2626',
            },
          },
          loading: {
            style: {
              background: "#1e40af",
              border: '1px solid #2563eb',
            },
          },
        }}
      />
      {!isAuthInitialized ? (
        // Show loading state while Privy initializes
        <div className="relative w-full h-screen bg-zinc-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-zinc-400 text-lg">Initializing...</p>
          </div>
        </div>
      ) : (
        // Render the full component (always visible, regardless of wallet connection)
        <div className="min-h-screen bg-zinc-900">
          {/* Header Section */}
          <CacheManagerHeader 
            isConnected={isConnected} 
            setIsModalOpen={setIsModalOpen}
            networkKey={networkKey}
            onNetworkChange={onNetworkChange}
          />

          {/* Main Content */}
          <div className="px-6 lg:px-8 py-8 space-y-8">

            {/* Analytics Cards */}
            <CacheAnalyticsCards
              cacheSize={cacheSize}
              queueSize={queueSize}
              entriesCount={entriesCount}
              isPaused={isPaused}
              decay={decay}
              filteredEntries={filteredEntries}
            />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cache Savings Analysis Chart */}
              <CacheSavingsAnalysis
                loadingGasAnalysis={loadingGasAnalysis}
                isIncrementalUpdate={isIncrementalUpdate}
                fetchProgramAddresses={fetchProgramAddresses}
                gasAnalysisData={gasAnalysisData}
                cacheData={cacheData}
                programAddresses={programAddresses}
                lastFetchedBlock={lastFetchedBlock}
                networkKey={networkKey}
              />
              {/* Cache Size Distribution */}
              <CacheSizeDistributionChart
                chartDataCacheSize={chartDataCacheSize}
                hoveredChart={hoveredChart}
                setHoveredChart={setHoveredChart}
                averageSize={averageSize}
              />
              {/* Contract Entries Over Time */}
              <ContractEntriesChart
                chartData={chartData}
                hoveredChart={hoveredChart}
                setHoveredChart={setHoveredChart}
              />
              {/* Minimum Bid Over Time */}
              <MinBidChart
                chartDataMinBid={chartDataMinBid}
                hoveredChart={hoveredChart}
                setHoveredChart={setHoveredChart}
                overallMinBid={overallMinBid}
              />
            </div>

            {/* Entries Table */}
            <CacheEntriesTable
              filteredEntries={filteredEntries}
              paginatedEntries={paginatedEntries}
              entriesPerPage={entriesPerPage}
              setEntriesPerPage={setEntriesPerPage}
              currentPage={currentPage}
              pageCount={pageCount}
              setCurrentPage={setCurrentPage}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              handleSort={handleSort}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showEntriesDropdown={showEntriesDropdown}
              setShowEntriesDropdown={setShowEntriesDropdown}
            />

            {/* Bid Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlaceBidForm
                contractAddress={contractAddress}
                addressError={addressError}
                handleAddressChange={handleAddressChange}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
                handlePlaceBid={handlePlaceBid}
                isLoading={isLoading}
                minBid={minBid}
                handleAskAI={handleAskAI}
                isConnected={isConnected}
              />
              <FetchSmallestEntries
                smallestEntriesCount={smallestEntriesCount}
                setSmallestEntriesCount={setSmallestEntriesCount}
                fetchSmallestEntries={fetchSmallestEntries}
                fetchingSmallestEntries={fetchingSmallestEntries}
                smallestEntries={smallestEntries}
              />
            </div>

            {/* ...other sections/components to be refactored... */}

            <ConfigureAIModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onUpdateData={handleDataUpdate}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CacheManagerPage;