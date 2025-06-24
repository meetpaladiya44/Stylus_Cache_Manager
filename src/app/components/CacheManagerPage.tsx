"use client";
import "../css/Landing.css";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, WalletMinimal } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import {
  ArrowUpCircle,
  Database,
  Box,
  Activity,
  Zap,
  Bot,
  Check,
} from "lucide-react";
import { ethers } from "ethers";
import {
  displayDecay,
  getContract,
  getProvider,
} from "@/utils/CacheManagerUtils";
import { useRouter } from "next/navigation";
import ConfigureAIModal from "./ConfigureAIModal ";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import { cacheManagerConfig } from "@/config/CacheManagerConfig";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";

// Add function to check if wallet is connected
const useIsConnected = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          setIsConnected(accounts.length > 0);

          // Listen for account changes
          window.ethereum.on("accountsChanged", (accounts: string[]) => {
            setIsConnected(accounts.length > 0);
          });
        } catch (error) {
          console.error("Failed to check wallet connection:", error);
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  return isConnected;
};

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

const CacheManagerPage = () => {
  // Check if wallet is connected - keep this at the top with other hooks
  const isConnected = useIsConnected();
  const publicClient = usePublicClient();

  // All state hooks must be called unconditionally
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSmallestEntries, setFetchingSmallestEntries] = useState(false);
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [decay, setDecay] = useState(null);
  const [entries, setEntries] = useState([]);
  const [minBid, setMinBid] = useState<any>(null);
  const [minBidParam, setMinBidParam] = useState("");
  const [smallestEntries, setSmallestEntries] = useState([]);
  const [smallestEntriesCount, setSmallestEntriesCount] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [entriesCount, setEntriesCount] = useState([]);
  const [contractAddress, setContractAddress] = useState("");
  const [bidAmount, setBidAmount] = useState<any>("");
  const [queueSize, setQueueSize] = useState(null);
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
  const config = cacheManagerConfig.arbitrum_one;

  // Cache management constants
  const CACHE_KEY_PROGRAM_DATA = "cache_program_data_v2";
  const CACHE_KEY_GAS_ANALYSIS = "cache_gas_analysis_v2";
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
      console.error(
        `Failed to get program init gas for ${contractAddress}:`,
        error
      );
      throw error;
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
        { id: "chunk-scan" }
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
      const latestBlock = await publicClient.getBlockNumber();

      // Only fetch if there are new blocks
      if (latestBlock <= lastFetchedBlock) {
        console.log("📊 No new blocks since last fetch");
        return [];
      }

      console.log(
        `🔄 Incremental update: fetching events from block ${
          lastFetchedBlock + BigInt(1)
        } to ${latestBlock}`
      );

      const newLogs = await publicClient.getLogs({
        address: config.contracts.cacheManager.address as `0x${string}`,
        event: parseAbiItem(
          "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
        ),
        fromBlock: lastFetchedBlock + BigInt(1),
        toBlock: latestBlock,
      });

      setLastFetchedBlock(latestBlock);

      if (newLogs.length > 0) {
        console.log(
          `✅ Found ${newLogs.length} new events in incremental update`
        );

        // Extract new program addresses
        const newPrograms = [
          ...new Set(newLogs.map((log) => log.args?.program as string)),
        ];
        const existingPrograms = new Set(programAddresses);
        const trulyNewPrograms = newPrograms.filter(
          (addr) => !existingPrograms.has(addr)
        );

        if (trulyNewPrograms.length > 0) {
          console.log(
            `🆕 Found ${trulyNewPrograms.length} new program addresses:`,
            trulyNewPrograms
          );
          const updatedAddresses = [...programAddresses, ...trulyNewPrograms];
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
      return [];
    }
  };

  // Function to fetch all InsertBid events and extract program addresses
  const fetchProgramAddresses = async (forceRefresh = false) => {
    if (!publicClient || !isConnected) return;

    try {
      setLoadingGasAnalysis(true);

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
          toast.success(
            `Loaded cached data: ${cachedData.programAddresses.length} programs`
          );
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

      // Get the latest block number
      const latestBlock = await publicClient.getBlockNumber();
      console.log(`📊 Latest block number: ${latestBlock}`);

      let allLogs: any[] = [];

      // Strategy: Try optimal approaches first, fall back to chunking if needed
      console.log("🚀 Starting optimized event scan...");

      // Method 1: Try to get all events in one request first
      console.log(
        "🎯 Method 1: Attempting to fetch all events in single request..."
      );
      toast.loading("Attempting to fetch all contract events...", {
        id: "chunk-scan",
      });

      try {
        // Smart optimization: Start from a reasonable block instead of 0
        // For Arbitrum Sepolia, most contracts are deployed recently
        const estimatedDeploymentBlock =
          latestBlock > BigInt(1000000)
            ? latestBlock - BigInt(1000000)
            : BigInt(0);

        console.log(
          `🎯 Trying optimized range: ${estimatedDeploymentBlock} to ${latestBlock}`
        );

        // Try to get all events from estimated deployment to now
        allLogs = await publicClient.getLogs({
          address: config.contracts.cacheManager.address as `0x${string}`,
          event: parseAbiItem(
            "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
          ),
          fromBlock: estimatedDeploymentBlock,
          toBlock: latestBlock,
        });

        // If we got events but suspect there might be more in earlier blocks, do a quick check
        if (allLogs.length > 0 && estimatedDeploymentBlock > BigInt(0)) {
          console.log(
            `🔍 Found ${allLogs.length} events in recent range, checking if there are older events...`
          );

          try {
            const olderLogs = await publicClient.getLogs({
              address: config.contracts.cacheManager.address as `0x${string}`,
              event: parseAbiItem(
                "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
              ),
              fromBlock: BigInt(0),
              toBlock: estimatedDeploymentBlock - BigInt(1),
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
          id: "chunk-scan",
        });
      } catch (error: any) {
        console.warn(
          "⚠️ Single request failed, trying chunked approach:",
          error.message
        );
        toast.loading("Single request failed, using chunked approach...", {
          id: "chunk-scan",
        });

        // Method 2: Fall back to chunked scanning
        console.log("🎯 Method 2: Using chunked scanning as fallback...");
        allLogs = await fetchEventsInChunks(BigInt(0), latestBlock, 50000); // Larger chunks since we know it's one contract
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
        { id: "chunk-scan" }
      );

      if (uniqueLogs.length === 0) {
        console.log("❌ No InsertBid events found in entire blockchain");
        toast.error(
          "No InsertBid events found. Make sure bids have been placed on this contract."
        );
        setProgramAddresses([]);
        setGasAnalysisData({
          totalGasWithoutCache: 0,
          totalGasWithCache: 0,
          totalGasSaved: 0,
        });
        return;
      }

      // Extract unique program addresses and log them
      const uniquePrograms = [
        ...new Set(uniqueLogs.map((log) => log.args?.program as string)),
      ];
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
        toast.error("No program addresses extracted from events");
      }
    } catch (error: any) {
      console.error("❌ Error fetching program addresses:", error);
      toast.error(`Failed to fetch program addresses: ${error.message}`);
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
              console.log(`🔍 Getting gas data for: ${address}`);
              const gasData = await getProgramInitGas(address);
              totalGasWithoutCache += Number(gasData.gas);
              totalGasWithCache += Number(gasData.gasWhenCached);
              successfulCalculations++;

              console.log(
                `✅ Gas data for ${address}: ${gasData.gas} → ${gasData.gasWhenCached} (saved: ${gasData.gasSavings})`
              );
              return { success: true, address, gasData };
            } catch (error: any) {
              console.warn(
                `⚠️ Failed to get gas data for ${address}:`,
                error.message
              );
              failedCalculations.push(address);
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
          `Processed ${Math.min(i + batchSize, addresses.length)}/${
            addresses.length
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

  // All useEffect and other hooks must also be called unconditionally
  // Initial data fetch
  useEffect(() => {
    // Only fetch data if the user is connected
    if (isConnected) {
      const initialize = async () => {
        try {
          toast.loading("Loading cache data...", { id: "initialization" });
          await fetchEntries(false);
          await fetchCacheSize(false);
          await fetchDecay(false);
          await fetchQueueSize(false);
          await checkIsPaused(false);

          // Fetch program addresses and calculate gas analysis
          await fetchProgramAddresses();

          toast.success("Cache data loaded successfully!", {
            id: "initialization",
          });
        } catch (error: any) {
          // Parse initialization error
          let errorMessage = "Failed to initialize cache data";

          toast.error(errorMessage);
        }
      };

      initialize();
    }
  }, [isConnected]); // Add isConnected as dependency

  // Set up periodic incremental updates for live data
  useEffect(() => {
    if (!isConnected || !lastFetchedBlock) return;

    const interval = setInterval(async () => {
      if (!isIncrementalUpdate && !loadingGasAnalysis) {
        console.log("🔄 Performing periodic incremental update...");
        setIsIncrementalUpdate(true);
        await fetchIncrementalUpdates();
        setIsIncrementalUpdate(false);
      }
    }, INCREMENTAL_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, lastFetchedBlock, loadingGasAnalysis, isIncrementalUpdate]);

  const fetchCacheSize = async (showToast = true) => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.cacheSize();
      setCacheSize(size.toString());
    } catch (error: any) {
      console.error("Error fetching cache size:", error);
      const errorMessage = showToast
        ? `Failed to fetch cache size: ${error?.message || error}`
        : "Error fetching cache size";
      if (showToast) {
        toast.error(errorMessage);
      }
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
      const contract = await getContract();
      const decay = await contract.decay();
      setDecay(decay.toString());
    } catch (error: any) {
      console.error("Error fetching decay:", error);
      const errorMessage = showToast
        ? `Failed to fetch decay: ${error?.message || error}`
        : "Error fetching decay";
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Queue Size
  const fetchQueueSize = async (showToast = true) => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.queueSize();
      setQueueSize(size.toString());
    } catch (error: any) {
      console.error("Error fetching queue size:", error);
      const errorMessage = showToast
        ? `Failed to fetch queue size: ${error?.message || error}`
        : "Error fetching queue size";
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Paused
  const checkIsPaused = async (showToast = true) => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const paused = await contract.isPaused();
      setIsPaused(paused);
    } catch (error: any) {
      console.error("Error checking pause status:", error);
      const errorMessage = showToast
        ? `Failed to check if paused: ${error?.message || error}`
        : "Error checking pause status";
      if (showToast) {
        toast.error(errorMessage);
      }
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
      console.log("inside fetch entries");
      setIsLoading(true);
      const contract = await getContract();

      // Fetch raw entries from the contract
      const rawEntries: any = await contract.getEntries();
      console.log("Raw entries object:", rawEntries);

      const formattedEntries = formatProxyResult(rawEntries);
      console.log("Formatted entries:", formattedEntries);

      const numberOfEntries = formattedEntries.length;
      setEntriesCount(numberOfEntries);
      setEntries(formattedEntries);
    } catch (error: any) {
      console.error("Error fetching entries:", error);
      const errorMessage = showToast
        ? `Failed to fetch entries: ${error?.message || error}`
        : "Error fetching entries";
      if (showToast) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return entries.map((entry: any, index: any) => ({
      index: index + 1, // Use index + 1 for x-axis
      codeHash: entry.codeHash.slice(0, 6) + "...",
      size: Number(entry.size),
      bid: Number(ethers.formatEther(entry.bid)),
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

      const contract = await getContract();

      const tx = await contract.placeBid(contractAddress, {
        value: ethers.parseEther(bidAmount).toString(),
        gasLimit: 3000000,
      });

      await tx.wait();
      toast.success("Bid placed successfully!", { id: "place-bid" });

      // Clear form
      setContractAddress("");
      setBidAmount("");

      // Refresh the entries after successful bid
      await fetchEntries();
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

    try {
      setFetchingSmallestEntries(true);
      toast.loading("Fetching smallest entries...", { id: "smallest-entries" });

      const contract = await getContract();
      const smallestEntries = await contract.getSmallestEntries(k);
      setSmallestEntries(smallestEntries);

      toast.success(`Fetched ${k} smallest entries successfully!`, {
        id: "smallest-entries",
      });
    } catch (error: any) {
      console.error("Error fetching smallest entries:", error);

      // Parse error for user-friendly message
      let errorMessage = "Error fetching smallest entries";
      const errorString = String(error);

      if (errorString.includes("transaction execution reverted")) {
        errorMessage =
          "Failed to fetch smallest entries: Contract execution failed";
      } else if (errorString.includes("network")) {
        errorMessage = "Failed to fetch smallest entries: Network error";
      } else if (error?.message && error.message.length <= 100) {
        errorMessage = `Failed to fetch smallest entries: ${error.message}`;
      } else {
        errorMessage =
          "Failed to fetch smallest entries: Unable to retrieve data";
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
        ethers.formatEther(BigInt(entry.bid)).includes(searchTerm)
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
      currentBid: Number(ethers.formatEther(entry.bid)),
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
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#EF4444",
            },
          },
          loading: {
            style: {
              background: "#3B82F6",
            },
          },
        }}
      />
      {!isConnected ? (
        // Render the blurred image with connect button when not connected
        <div className="relative w-full h-screen p-4">
          <Image
            src="/blur_smart_cache_img.png"
            alt="Blurred Cache Manager"
            fill
            sizes="100vw"
            className="opacity-80"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 drop-shadow-lg">
              Connect your wallet to access SmartCache
            </h1>
            <div className="z-10">
              <ConnectKitButton />
            </div>
          </div>
        </div>
      ) : (
        // Render the full component when connected
        <div className="p-6 space-y-8 bg-gray-100 min-h-screen pl-[4rem] pr-[3rem] bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 animate-fade-in-down">
              Cache Manager Analytics
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 rounded-xl hover:bg-blue-600 text-white px-4 py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
            >
              <WalletMinimal className="w-5 h-5" />
              Add Balance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:from-blue-600 hover:to-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Cache Size</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {cacheSize + " " + "Bytes"}
                  </h3>
                </div>
                <Database className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm">Hit Rate</p>
                <div className="flex items-center mt-1">
                  <span className="text-xl font-semibold">67 %</span>
                  {/* <span className="text-xl font-semibold">{hitRate}%</span> */}
                  <ArrowUpCircle className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:from-purple-600 hover:to-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Queue Size</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {queueSize + " " + "Bytes"}
                  </h3>
                </div>
                <Box className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm">Total Entries in Contracts</p>
                <p className="text-xl font-semibold mt-1">
                  {entriesCount ? entriesCount : "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:from-green-600 hover:to-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Decay Rate</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {decay && displayDecay(decay)}
                  </h3>
                </div>
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm">Bid Status</p>
                <p className="text-xl font-semibold mt-1">
                  {isPaused ? "Inactive" : "Active"}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:from-orange-600 hover:to-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Cache Occupancy Ratio</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {((filteredEntries.length / 4000) * 100).toFixed(3)}%
                  </h3>
                </div>
                <Zap className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm">Optimization</p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white rounded-full h-2"
                    style={{
                      width: `${(filteredEntries.length / 4000) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cache Usage Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              style={{ backgroundColor: hoverColor }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Cache Savings Analysis
                </h2>
                <div className="flex items-center gap-2">
                  {loadingGasAnalysis && (
                    <div className="flex items-center gap-2 text-blue-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  )}
                  {isIncrementalUpdate && (
                    <div className="flex items-center gap-2 text-green-500">
                      <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Live Update</span>
                    </div>
                  )}
                  <button
                    onClick={() => fetchProgramAddresses(true)}
                    disabled={loadingGasAnalysis}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Refresh Analysis
                  </button>
                  {/* <button
                    onClick={() => {
                      console.log("🔧 DEBUG INFO:");
                      console.log(
                        `📍 Contract Address: ${config.contracts.cacheManager.address}`
                      );
                      console.log(
                        `🔗 Network: ${publicClient?.chain?.name || "Unknown"}`
                      );
                      console.log(`👤 Connected: ${isConnected}`);
                      console.log(
                        `📋 Current Program Addresses: ${programAddresses.length}`,
                        programAddresses
                      );
                      console.log(`📊 Current Gas Data:`, gasAnalysisData);
                      toast.success("Debug info logged to console");
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition duration-200"
                  >
                    Debug
                  </button> */}
                </div>
              </div>
              <div className="h-64">
                {loadingGasAnalysis ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">
                        Fetching program addresses...
                      </p>
                      <p className="text-sm text-gray-400">
                        Calculating gas savings from recent bids
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cacheData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                        onMouseEnter={(data, index) => {
                          setHoverColor(
                            index === 0
                              ? "rgba(76, 175, 80, 0.1)"
                              : "rgba(33, 150, 243, 0.1)"
                          );
                        }}
                        onMouseLeave={() => setHoverColor("")}
                      >
                        {cacheData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? "#4CAF50" : "#2196F3"}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) =>
                          `${Number(value).toLocaleString()} gas units`
                        }
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-red-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:bg-red-100 border border-red-200">
                  <div className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h4 className="text-gray-800 font-medium">Without Cache</h4>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-red-600">
                    {gasAnalysisData.totalGasWithoutCache.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Gas Units</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:bg-green-100 border border-green-200">
                  <div className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <h3 className="text-gray-800 font-medium">With Cache</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-green-600">
                    {gasAnalysisData.totalGasWithCache.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Gas Units</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:bg-blue-100 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-gray-800 font-medium">Gas Saved</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-blue-600">
                    {gasAnalysisData.totalGasSaved.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Gas Units</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Programs analyzed:{" "}
                    <strong>{programAddresses.length}</strong>
                  </span>
                  {gasAnalysisData.totalGasSaved > 0 && (
                    <span>
                      Average savings per program:{" "}
                      <strong>
                        {Math.round(
                          gasAnalysisData.totalGasSaved /
                            programAddresses.length
                        ).toLocaleString()}
                      </strong>{" "}
                      gas units
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Data based on{" "}
                  {lastFetchedBlock
                    ? `blockchain data up to block ${lastFetchedBlock.toString()}`
                    : "recent events from the cache manager contract"}{" "}
                  •
                  {isIncrementalUpdate
                    ? " Live updating..."
                    : " Auto-updates every minute"}
                </p>
              </div>
            </motion.div>

            {/* Cache Size Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              style={{
                backgroundColor:
                  hoveredChart === "cacheSize"
                    ? "rgba(248, 251, 255, 0.5)"
                    : "white",
              }}
              onMouseEnter={() => setHoveredChart("cacheSize")}
              onMouseLeave={() => setHoveredChart(null)}
            >
              <h2 className="text-xl font-semibold mb-4">
                Cache Size Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDataCacheSize}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="codeHash"
                      interval={5}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 5 }}
                    />
                    <YAxis
                      label={{
                        value: "Size (bytes)",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 12,
                      }}
                      tick={{ fontSize: 8 }}
                    />
                    <Tooltip
                      formatter={(value) => `${value.toLocaleString()} bytes`}
                      labelFormatter={(label) => `Code Hash: ${label}`}
                    />
                    <Legend />
                    {/* <ReferenceLine
                  y={averageSize}
                  stroke="#ff7300"
                  strokeDasharray="3 3"
                  label={{
                    value: "Average Size",
                    position: "bottom",
                    fill: "#ff7300",
                  }}
                /> */}
                    <Line
                      type="monotone"
                      dataKey="currentSize"
                      stroke="#8884d8"
                      name="Entry Size"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageSize"
                      stroke="#82ca9d"
                      name="Running Average"
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeSize"
                      fill="#8884d8"
                      stroke="#8884d8"
                      fillOpacity={0.1}
                      name="Cumulative Size"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-600 flex justify-between">
                <span>
                  Total Cache Size:{" "}
                  {chartDataCacheSize[
                    chartDataCacheSize.length - 1
                  ]?.cumulativeSize.toLocaleString()}{" "}
                  bytes
                </span>
                <span>
                  Average Entry Size: {averageSize.toLocaleString()} bytes
                </span>
              </div>
            </motion.div>

            {/* Contract Entries Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              style={{
                backgroundColor:
                  hoveredChart === "contractEntries"
                    ? "rgba(251, 246, 255, 0.5)"
                    : "white",
              }}
              onMouseEnter={() => setHoveredChart("contractEntries")}
              onMouseLeave={() => setHoveredChart(null)}
            >
              <h2 className="text-xl font-semibold mb-4">
                Contract Entries Analysis
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="codeHash"
                      interval={5}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 5 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === "bid") return `${value.toFixed(4)}`;
                        if (name === "size")
                          return `${value.toLocaleString()} bytes`;
                        return value;
                      }}
                      labelFormatter={(label) => `Code Hash: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="size"
                      stroke="#82ca9d"
                      name="Size (bytes)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bid"
                      stroke="#8884d8"
                      name="Bid Value"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Minimum Bid Over Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              style={{
                backgroundColor:
                  hoveredChart === "minBid"
                    ? "rgba(255, 247, 240, 0.5)"
                    : "white",
              }}
              onMouseEnter={() => setHoveredChart("minBid")}
              onMouseLeave={() => setHoveredChart(null)}
            >
              <h2 className="text-xl font-semibold mb-4">
                Minimum Bid Analysis Over Entries
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataMinBid}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="codeHash"
                      interval={1}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 5 }}
                    />
                    <YAxis
                      label={{
                        value: "Bid Value",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: any) => `${value.toFixed(6)}`}
                      labelFormatter={(label) => `Code Hash: ${label}`}
                    />
                    <Legend />
                    <ReferenceLine
                      y={overallMinBid}
                      stroke="red"
                      strokeDasharray="3 3"
                      label={{
                        value: "Minimum Bid Threshold",
                        position: "top",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="currentBid"
                      stroke="#ffc658"
                      name="Current Bid"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minBid"
                      stroke="#ff7300"
                      name="Minimum Bid"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgBid"
                      stroke="#82ca9d"
                      name="Average Bid"
                      dot={{ r: 4 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg mt-8 transition-all duration-300 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
              Current Contract Entries
            </h2>
            <div className="mb-4 flex justify-between items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                  className="bg-white border border-gray-300 rounded-md px-4 py-2 inline-flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Show {entriesPerPage}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                {showEntriesDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      {[5, 10, 20, 50].map((number) => (
                        <button
                          key={number}
                          onClick={() => {
                            setEntriesPerPage(number);
                            setShowEntriesDropdown(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                          role="menuitem"
                        >
                          Show {number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-auto max-h-96 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        // onClick={() => handleSort("codeHash")}
                        className="font-semibold text-xs uppercase tracking-wider flex items-center"
                      >
                        Code Hash
                        {/* {sortColumn === "codeHash" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))} */}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("size")}
                        className="font-semibold text-xs uppercase tracking-wider flex items-center"
                      >
                        Size (Bytes)
                        {sortColumn === "size" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                          ))}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <button
                        onClick={() => handleSort("bid")}
                        className="font-semibold text-xs uppercase tracking-wider flex items-center"
                      >
                        Bid Value
                        {sortColumn === "bid" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                          ))}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {paginatedEntries.length > 0 ? (
                      paginatedEntries.map((entry: any, index: any) => (
                        <motion.tr
                          key={entry.codeHash}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span title={entry.codeHash}>
                              {entry.codeHash.slice(0, 20)}...
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Number(entry.size).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ethers.formatEther(BigInt(entry.bid))}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                        >
                          No entries found
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                Showing {Math.min(filteredEntries.length, entriesPerPage)} of{" "}
                {filteredEntries.length} entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pageCount))
                  }
                  disabled={currentPage === pageCount}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bid Management Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
                Place a Bid
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {addressError && (
                    <p className="text-sm text-red-600">{addressError}</p>
                  )}
                  {!addressError && contractAddress && (
                    <Check className="absolute right-3 top-[2.3rem] text-green-500 w-5 h-5" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Value
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    step="0.000000000000000001"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handlePlaceBid}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !contractAddress || !bidAmount}
                  >
                    {isLoading ? "Placing Bid..." : "Place Bid"}
                  </button>

                  <button
                    onClick={handleAskAI}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                  >
                    <Bot className="w-5 h-5" />
                    Ask AI
                  </button>
                </div>

                {minBid && (
                  <p className="text-sm text-gray-600">
                    Minimum Bid Required: {minBid} ETH
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
                Fetch Smallest Entries
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Entries
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter number"
                      value={smallestEntriesCount}
                      onChange={(e) => setSmallestEntriesCount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => fetchSmallestEntries(smallestEntriesCount)}
                      className="bg-gray-600 hover:bg-gray-800 hover:cursor-pointer text-white px-4 py-2 rounded transition duration-200 w-1/2"
                      disabled={
                        fetchingSmallestEntries || !smallestEntriesCount
                      }
                    >
                      {fetchingSmallestEntries
                        ? "Fetching..."
                        : "Get Smallest Entries"}
                    </button>
                  </div>
                </div>
                {smallestEntries && (
                  <AnimatePresence>
                    {smallestEntries.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="max-h-48 overflow-y-auto overflow-x-auto mt-4 w-full rounded p-2 bg-gray-50" // Background for the container
                      >
                        <ul className="space-y-2">
                          {smallestEntries.map((entry, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="font-mono p-2 rounded bg-gray-100 text-black whitespace-nowrap" // Individual background and spacing retained
                            >
                              {entry}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>

          <ConfigureAIModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpdateData={handleDataUpdate}
          />
        </div>
      )}
    </>
  );
};

export default CacheManagerPage;
