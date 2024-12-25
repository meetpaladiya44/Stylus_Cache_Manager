"use client";
import "../css/Landing.css";

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
import { ArrowUpCircle, Database, Box, Activity, Zap, Bot } from "lucide-react";
import { ethers } from "ethers";
import {
  displayDecay,
  getContract,
  getProvider,
  getPrecompiledContract,
  getPrecompiledProvider,
} from "@/utils/CacheManagerUtils";
import { useRouter } from "next/navigation";

type RawEntry = [string, number, number]; // [codeHash, size, ethBid]
type FormattedEntry = {
  codeHash: string | any;
  size: number | any;
  ethBid: number | any;
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
  const [initCacheSize, setInitCacheSize] = useState("");
  const [initDecayRate, setInitDecayRate] = useState("");
  const [newCacheSize, setNewCacheSize] = useState("");
  const [newDecayRate, setNewDecayRate] = useState("");
  const [evictCount, setEvictCount] = useState("");

  const [cacheData, setCacheData] = useState({
    used: 75,
    available: 25,
  });

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

  const router = useRouter();

  const COLORS = ["#0088FE", "#00C49F"];

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
  }

  return (
    <div className="p-6 space-y-8 bg-gray-100 min-h-screen pl-[4rem] pr-[3rem]">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Cache Manager Analytics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
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
              <span className="text-xl font-semibold">-- %</span>
              {/* <span className="text-xl font-semibold">{hitRate}%</span> */}
              <ArrowUpCircle className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
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

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
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

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Performance</p>
              <h3 className="text-2xl font-bold mt-1">--%</h3>
            </div>
            <Zap className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4">
            <p className="text-sm">Optimization</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-white rounded-full h-2 w-[95%]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Usage Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Cache Usage Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Used", value: cacheData.used },
                    { name: "Available", value: cacheData.available },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Size Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
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
        </div>

        {/* Contract Entries Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
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
        </div>

        {/* Minimum Bid Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
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
        </div>
      </div>

      {/* Contract Entries Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg mt-8 ">
        <h2 className="text-xl font-semibold mb-4">Current Contract Entries</h2>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size (Bytes)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid Amount (ETH)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries?.map((entry: any, index: any) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                      {entry?.codeHash}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(entry?.size).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ethers.formatEther(BigInt(entry?.bid))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bid Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-lg max-h-fit">
          <h2 className="text-xl font-semibold mb-4 text-black">Place a Bid</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
              />
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
                className="w-full p-2 border border-gray-300 rounded text-black"
                step="0.000000000000000001"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handlePlaceBid}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 hover:cursor-pointer"
                disabled={isLoading || !contractAddress || !bidAmount}
              >
                {isLoading ? "Placing Bid..." : "Place Bid"}
              </button>

              <button
                onClick={handleAskAI}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg transition duration-200"
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
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg ">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Fetch Smallest Entries
          </h2>
          <div className="space-y-4">
            <div className="">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Entries
              </label>
              <div className="flex  gap-2">
                <input
                  type="number"
                  placeholder="Enter number"
                  value={smallestEntriesCount}
                  onChange={(e) => setSmallestEntriesCount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
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
              <div>
                {/* Remaining entries in scrollable container */}
                {smallestEntries.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="space-y-2">
                      {smallestEntries.map((entry, index) => (
                        <li
                          key={index}
                          className="font-mono bg-white p-2 rounded text-black"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManagerPage;
