"use client";
import "../css/Landing.css";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
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
  const [errorMessage, setErrorMessage] = useState<any>("");
  const [successMessage, setSuccessMessage] = useState("");
  // const [initCacheSize, setInitCacheSize] = useState("");
  // const [initDecayRate, setInitDecayRate] = useState("");
  // const [newCacheSize, setNewCacheSize] = useState("");
  // const [newDecayRate, setNewDecayRate] = useState("");
  // const [evictCount, setEvictCount] = useState("");
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

  // const [cacheData, setCacheData] = useState({
  //   used: 75,
  //   available: 25,
  // });

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

  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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

  // Add this transformation function
  const formatEntries = (entries: RawEntry[]): FormattedEntry[] => {
    return entries.map((entry) => ({
      codeHash: entry[0],
      size: BigInt(entry[1]),
      ethBid: entry[2],
    }));
  };

  // Initial data fetch
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchEntries();
        await fetchCacheSize();
        await fetchDecay();
        await fetchQueueSize();
        await checkIsPaused();
        // await getContractTransactions();
        // await getPlaceBidTransactions();
      } catch (error) {
        console.error("Initialization error:", error);
        setErrorMessage("Failed to initialize: " + error);
      }
    };

    initialize();
  }, []);

  const fetchCacheSize = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.cacheSize();
      setCacheSize(size.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch cache size: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Decay
  const fetchDecay = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const decay = await contract.decay();
      setDecay(decay.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch decay: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Queue Size
  const fetchQueueSize = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const size = await contract.queueSize();
      setQueueSize(size.toString());
    } catch (error) {
      setErrorMessage("Failed to fetch queue size: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if Paused
  const checkIsPaused = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const paused = await contract.isPaused();
      setIsPaused(paused);
    } catch (error) {
      setErrorMessage("Failed to check if paused: " + error);
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

  const fetchEntries = async () => {
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
      setSuccessMessage(`Fetched ${numberOfEntries} valid entries.`);
    } catch (error) {
      console.error("Error fetching entries:", error);
      setErrorMessage("Failed to fetch entries: " + error);
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
      setErrorMessage("");
      setSuccessMessage("");

      if (!ethers.isAddress(contractAddress)) {
        throw new Error("Invalid contract address");
      }

      if (isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
        throw new Error("Bid amount must be greater than zero");
      }

      if (minBid && parseFloat(bidAmount) < parseFloat(minBid)) {
        throw new Error(`Bid amount must be at least ${minBid} ETH`);
      }

      const provider = await getProvider();
      await provider.send("eth_requestAccounts", []);

      const contract = await getContract();

      const tx = await contract.placeBid(contractAddress, {
        value: ethers.parseEther(bidAmount).toString(),
        gasLimit: 3000000,
      });

      await tx.wait();
      setSuccessMessage("Bid placed successfully!");

      // Refresh the entries after successful bid
      await fetchEntries();
    } catch (error) {
      console.error(error);
      setErrorMessage(`Failed to place bid: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmallestEntries = async (k: any) => {
    try {
      setFetchingSmallestEntries(true);
      const contract = await getContract();
      const smallestEntries = await contract.getSmallestEntries(k);
      setSmallestEntries(smallestEntries);
    } catch (error) {
      setErrorMessage("Failed to fetch smallest entries: " + error);
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

  // const handleAskAI = () => {
  //   router.push("/ask-ai");
  // };

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

  const calculateGasUsage = (): any => {
    const totalEntriesOfPlaceBid = Number(77);
    const gasWithoutCache = Number(14265);
    const gasWithCache = Number(1580);

    const totalGasWithCache = totalEntriesOfPlaceBid * gasWithCache;
    const totalGasWithoutCache = totalEntriesOfPlaceBid * gasWithoutCache;
    const gasSaved = totalGasWithoutCache - totalGasWithCache;

    return {
      withCache: totalGasWithCache,
      withoutCache: totalGasWithoutCache,
      saved: gasSaved,
    };
  };

  // Example usage
  const gasUsage = calculateGasUsage();
  console.log(`Gas used with cache: ${gasUsage.withCache}`);
  console.log(`Gas used without cache: ${gasUsage.withoutCache}`);

  const cacheData = [
    { name: "Gas Saved", value: gasUsage.saved },
    { name: "Gas Used With Cache", value: gasUsage.withCache },
  ];

  return (
    <div className="p-6 space-y-8 bg-gray-100 min-h-screen pl-[4rem] pr-[3rem] bg-gradient-to-br from-gray-100 to-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 animate-fade-in-down">
        Cache Manager Analytics
      </h1>

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
                style={{ width: `${(filteredEntries.length / 4000) * 100}%` }}
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
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">
            Cache Savings Analysis
          </h2>
          <div className="h-64">
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
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
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
                {gasUsage.withoutCache.toLocaleString()}
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
                {gasUsage.withCache.toLocaleString()}
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
                {gasUsage.saved.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">Gas Units</p>
            </div>
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
                    if (name === "bid") return `${value.toFixed(4)} ETH`;
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
                  name="Bid (ETH)"
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
              hoveredChart === "minBid" ? "rgba(255, 247, 240, 0.5)" : "white",
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
                    value: "ETH",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) => `${value.toFixed(6)} ETH`}
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
                    Bid Amount (ETH)
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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                Bid Amount (ETH)
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
                // onClick={handleAskAI}
                onClick={() => setIsModalOpen(true)}
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
                  disabled={fetchingSmallestEntries || !smallestEntriesCount}
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
  );
};

export default CacheManagerPage;
