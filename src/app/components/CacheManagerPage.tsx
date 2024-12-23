"use client";
import "../css/Landing.css";

import React, { useState, useEffect } from "react";
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
} from "recharts";
import { ArrowUpCircle, Database, Box, Activity, Zap } from "lucide-react";
import { ethers } from "ethers";
import {
  displayDecay,
  getContract,
  getProvider,
} from "@/utils/CacheManagerUtils";

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

  const COLORS = ["#0088FE", "#00C49F"];

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

  const fetchEntries = async () => {
    try {
      console.log("inside fetch entries");
      setIsLoading(true);
      const contract = await getContract();

      // Fetch raw entries from the contract
      const rawEntries: any = await contract.getEntries();
      console.log("Raw entries object:", rawEntries);

      // Extract keys from rawEntries
      const keys = Object.keys(rawEntries); // Get the numeric keys
      console.log("Keys in rawEntries:", keys);

      // Access values using the keys
      const rawArray = keys.map((key) => rawEntries[key]);
      console.log("Extracted array from rawEntries:", rawArray);

      // Filter and validate entries
      const processedEntries = await rawArray.reduce((acc, entry, index) => {
        console.log("Processing entry at index", index, ":", entry);
        // try {
        //   if (ethers.isAddress(entry)) {
        acc.push(entry);
        //   } else {
        //     console.warn(`Invalid entry at index ${index}:`, entry);
        //   }
        // } catch (error) {
        //   console.warn(`Error processing entry at index ${index}:`, entry);
        // }
        return acc;
      }, []);

      // Update state
      const numberOfEntries = await processedEntries.length;
      const lastTenEntries = processedEntries.slice(-10).reverse();
      setEntriesCount(numberOfEntries);
      setEntries(processedEntries);
      //   setEntries(lastTenEntries);
      setSuccessMessage(`Fetched ${numberOfEntries} valid entries.`);
    } catch (error) {
      console.error("Error fetching entries:", error);
      setErrorMessage("Failed to fetch entries: " + error);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Cache Manager Analytics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Cache Size</p>
              <h3 className="text-2xl font-bold mt-1">
                {cacheSize + " " + "KiB"}
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
                {queueSize + " " + "KiB"}
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
          <h2 className="text-xl font-semibold mb-4">Cache Size Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cacheSize"
                  stroke="#8884d8"
                  name="Cache Size"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Entries Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Contract Entries Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="entries"
                  stroke="#82ca9d"
                  name="Number of Entries"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Minimum Bid Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Minimum Bid Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="minBid"
                  stroke="#ffc658"
                  name="Minimum Bid (ETH)"
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
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((entry: any, index: any) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                      {entry[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(entry[1])}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ethers.formatEther(BigInt(entry[2]))}
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
              {/* <button
              onClick={() => fetchMinBid(minBidParam)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
              disabled={isLoading || !contractAddress}
            >
              {isLoading ? "Fetching..." : "Get Minimum Bid"}
            </button> */}
              <button
                onClick={handlePlaceBid}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
                disabled={isLoading || !contractAddress || !bidAmount}
              >
                {isLoading ? "Placing Bid..." : "Place Bid"}
              </button>
            </div>

            {minBid && (
              <p className="text-sm text-gray-600">
                Minimum Bid Required: {minBid} ETH
              </p>
            )}
          </div>
        </div>

        {/* <div className="bg-white p-6 rounded-xl shadow-lg ">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Fetch Smallest Entries
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Entries
              </label>
              <input
                type="number"
                placeholder="Enter number"
                value={smallestEntriesCount}
                onChange={(e) => setSmallestEntriesCount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
              />
            </div>
            <button
              onClick={() => fetchSmallestEntries(smallestEntriesCount)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
              disabled={fetchingSmallestEntries || !smallestEntriesCount}
            >
              {fetchingSmallestEntries ? "Fetching..." : "Get Smallest Entries"}
            </button>
            {smallestEntries && (
              <ul className="space-y-2 ">
                {smallestEntries.map((entry, index) => (
                  <li
                    key={index}
                    className="font-mono bg-white p-2 rounded text-black overflow-auto"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div> */}
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
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200 w-1/2"
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
                {smallestEntries.length > 5 && (
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="space-y-2">
                      {smallestEntries.map((entry, index) => (
                        <li
                          key={index + 5}
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
