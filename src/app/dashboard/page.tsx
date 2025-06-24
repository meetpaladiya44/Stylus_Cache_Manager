"use client";

import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { cacheManagerConfig } from "@/config/CacheManagerConfig";
import { parseAbiItem, formatEther } from "viem";
import {
  Database,
  TrendingUp,
  Clock,
  Wallet,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Cache keys
const CACHE_KEY_BIDS = "user_bids_cache_";
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

// Use larger initial block range - 2.5 million blocks
const INITIAL_BLOCKS_RANGE = 2500000;
const BATCH_SIZE = 50; // Increased batch size for faster processing

interface BidEvent {
  blockNumber: bigint;
  transactionHash: string;
  args: {
    codehash: string;
    program: string;
    bid: bigint;
    size: bigint;
  };
  timestamp?: number;
}

// Separate interface for serializable version (no BigInt)
interface SerializableBidEvent {
  blockNumber: string;
  transactionHash: string;
  args: {
    codehash: string;
    program: string;
    bid: string;
    size: string;
  };
  timestamp?: number;
}

interface CacheData {
  bids: SerializableBidEvent[];
  timestamp: number;
  latestBlock: string;
  earliestFetchedBlock: string;
}

const UserDashboard = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [userBids, setUserBids] = useState<BidEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [earliestFetchedBlock, setEarliestFetchedBlock] = useState<
    bigint | null
  >(null);
  const [latestFetchedBlock, setLatestFetchedBlock] = useState<bigint | null>(
    null
  );
  const [loadStats, setLoadStats] = useState<{
    totalEvents: number;
    userEvents: number;
    processedBlocks: number;
  }>({
    totalEvents: 0,
    userEvents: 0,
    processedBlocks: 0,
  });
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [minBidFromEntries, setMinBidFromEntries] = useState<bigint | null>(
    null
  );

  const config = cacheManagerConfig.arbitrum_one;

  // Function to fetch all entries from contract
  const fetchAllEntries = async () => {
    try {
      const { getContract } = await import("@/utils/CacheManagerUtils");
      const contract = await getContract();
      const rawEntries = await contract.getEntries();

      // Format entries similar to CacheManagerPage
      const formatProxyResult = (proxyResult: any) => {
        const formatValue = (value: any) => {
          if (typeof value === "bigint") {
            return value;
          }
          return value;
        };

        const formatEntry = (entry: any) => {
          return {
            codeHash: formatValue(entry[0]),
            size: formatValue(entry[1]),
            bid: formatValue(entry[2]),
          };
        };

        if (
          Array.isArray(proxyResult) ||
          (typeof proxyResult === "object" && proxyResult !== null)
        ) {
          const keys = Object.keys(proxyResult);
          if (keys.every((key: any) => !isNaN(key))) {
            if (keys.length === 3) {
              return formatEntry(proxyResult);
            }
            return keys.map((key) => {
              const entry = proxyResult[key];
              return formatEntry(entry);
            });
          }
        }
        return formatValue(proxyResult);
      };

      const formattedEntries = formatProxyResult(rawEntries);
      setAllEntries(
        Array.isArray(formattedEntries) ? formattedEntries : [formattedEntries]
      );

      // Find minimum bid
      const entries = Array.isArray(formattedEntries)
        ? formattedEntries
        : [formattedEntries];
      if (entries.length > 0) {
        const minBid = entries.reduce((min, entry) => {
          const bidValue = BigInt(entry.bid);
          return bidValue < min ? bidValue : min;
        }, BigInt(entries[0].bid));
        setMinBidFromEntries(minBid);
        console.log(
          `📊 Found minimum bid from ${entries.length} entries: ${minBid}`
        );
      }
    } catch (error) {
      console.error("Error fetching all entries:", error);
    }
  };

  useEffect(() => {
    if (isConnected && address && publicClient) {
      // Clear data when address changes
      setUserBids([]);
      setHasMoreData(true);
      setEarliestFetchedBlock(null);
      setLatestFetchedBlock(null);

      // Fetch all entries to get minimum bid
      fetchAllEntries();

      const cachedData = getCachedData();
      if (cachedData) {
        console.log(
          `✅ Cache hit! Found ${cachedData.bids.length} cached bids`
        );
        console.log(
          `📊 Cache range: ${cachedData.earliestFetchedBlock} to ${cachedData.latestBlock}`
        );

        // Apply deduplication to cached data as well (safety measure)
        const uniqueCachedBids = deduplicateBids(cachedData.bids);
        console.log(
          `🔧 After cache deduplication: ${uniqueCachedBids.length} unique bids`
        );

        setUserBids(uniqueCachedBids);
        setEarliestFetchedBlock(BigInt(cachedData.earliestFetchedBlock));
        setLatestFetchedBlock(BigInt(cachedData.latestBlock));

        // Only show "Load more" if we haven't scanned from block 0 yet
        const hasScannedFromGenesis =
          BigInt(cachedData.earliestFetchedBlock) === BigInt(0);
        setHasMoreData(
          !hasScannedFromGenesis &&
            BigInt(cachedData.earliestFetchedBlock) > BigInt(0)
        );

        console.log(
          `🔄 Cache loaded. Has more data: ${
            !hasScannedFromGenesis &&
            BigInt(cachedData.earliestFetchedBlock) > BigInt(0)
          } (scanned from genesis: ${hasScannedFromGenesis})`
        );
      } else {
        console.log(`❌ Cache miss. Starting fresh data fetch`);
        fetchInitialUserBids();
      }
    } else {
      console.log(`⚠️ Wallet not connected or missing required clients`);
    }
  }, [address, isConnected, publicClient]);

  // Convert BigInt to string for serialization
  const bidToSerializable = (bid: BidEvent): SerializableBidEvent => {
    return {
      blockNumber: bid.blockNumber.toString(),
      transactionHash: bid.transactionHash,
      args: {
        codehash: bid.args.codehash,
        program: bid.args.program,
        bid: bid.args.bid.toString(),
        size: bid.args.size.toString(),
      },
      timestamp: bid.timestamp,
    };
  };

  // Convert string back to BigInt after deserialization
  const serializableToBid = (serialized: SerializableBidEvent): BidEvent => {
    return {
      blockNumber: BigInt(serialized.blockNumber),
      transactionHash: serialized.transactionHash,
      args: {
        codehash: serialized.args.codehash,
        program: serialized.args.program,
        bid: BigInt(serialized.args.bid),
        size: BigInt(serialized.args.size),
      },
      timestamp: serialized.timestamp,
    };
  };

  const getCachedData = (): {
    bids: BidEvent[];
    latestBlock: string;
    earliestFetchedBlock: string;
  } | null => {
    if (!address) return null;

    try {
      const cacheKey = CACHE_KEY_BIDS + address.toLowerCase();
      console.log(`🔍 Looking for cache with key: ${cacheKey}`);

      const cachedDataString = localStorage.getItem(cacheKey);

      if (!cachedDataString) {
        console.log(`❌ No cached data found for this address`);
        return null;
      }

      const cachedData = JSON.parse(cachedDataString) as CacheData;
      const now = Date.now();
      const cacheAge = now - cachedData.timestamp;

      console.log(
        `⏰ Cache age: ${Math.round(
          cacheAge / 1000 / 60
        )} minutes (expires after ${CACHE_EXPIRY_TIME / 1000 / 60} minutes)`
      );

      // Check if cache is still valid
      if (now - cachedData.timestamp <= CACHE_EXPIRY_TIME) {
        console.log(`✅ Cache is still valid, returning cached data`);
        // Convert serialized data back to BigInt format
        const bids = cachedData.bids.map(serializableToBid);
        return {
          bids,
          latestBlock: cachedData.latestBlock,
          earliestFetchedBlock: cachedData.earliestFetchedBlock,
        };
      }

      // Cache expired
      console.log(`⏰ Cache expired, removing old cache`);
      localStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error("❌ Error accessing cache:", error);
      localStorage.removeItem(CACHE_KEY_BIDS + address.toLowerCase());
      return null;
    }
  };

  const setCachedData = (
    bids: BidEvent[],
    latestBlock: bigint,
    earliestBlock: bigint
  ) => {
    if (!address) return;

    try {
      const cacheKey = CACHE_KEY_BIDS + address.toLowerCase();
      console.log(`💾 Caching ${bids.length} bids for address: ${address}`);
      console.log(`📊 Cache range: ${earliestBlock} to ${latestBlock}`);

      // Convert BigInt to string before serialization
      const serializableBids = bids.map(bidToSerializable);

      const cacheData: CacheData = {
        bids: serializableBids,
        timestamp: Date.now(),
        latestBlock: latestBlock.toString(),
        earliestFetchedBlock: earliestBlock.toString(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Successfully cached data with key: ${cacheKey}`);
    } catch (error) {
      console.error("❌ Error setting cache:", error);
    }
  };

  const fetchInitialUserBids = async () => {
    if (!address || !publicClient) return;

    setLoading(true);
    setError(null);
    setLoadStats({
      totalEvents: 0,
      userEvents: 0,
      processedBlocks: 0,
    });

    console.log(`🔍 Starting to fetch bids for user: ${address}`);
    console.log(`📋 SCANNING STRATEGY:`);
    console.log(`   1️⃣ First: Scan latest 2.5M blocks (≈7 days)`);
    console.log(`   2️⃣ If no bids found: Auto-scan ALL remaining older blocks`);
    console.log(`   3️⃣ Always deduplicate results by transaction hash`);

    try {
      // Get the latest block number
      const latestBlock = await publicClient.getBlockNumber();
      console.log(`📊 Latest block number: ${latestBlock}`);

      // Start by fetching most recent 2.5 million blocks (approx 7 days)
      const fromBlock = latestBlock - BigInt(INITIAL_BLOCKS_RANGE);
      const startBlock = fromBlock > BigInt(0) ? fromBlock : BigInt(0);

      console.log(
        `🎯 Initial scan range: ${startBlock} to ${latestBlock} (${INITIAL_BLOCKS_RANGE.toLocaleString()} blocks - approx 7 days)`
      );

      let fetchedBids = await fetchUserBidsInRange(startBlock, latestBlock);
      console.log(
        `✅ Initial scan completed. Found ${fetchedBids.length} user bids in recent blocks`
      );

      // If no bids found in recent blocks AND there are older blocks to scan, automatically scan all older blocks
      if (fetchedBids.length === 0 && startBlock > BigInt(0)) {
        console.log(
          `⚠️ No bids found in recent ${INITIAL_BLOCKS_RANGE.toLocaleString()} blocks. Starting comprehensive scan from block 0...`
        );
        console.log(
          `🔍 Comprehensive scan range: 0 to ${
            startBlock - BigInt(1)
          } (${startBlock} blocks)`
        );

        // Scan from block 0 to the start of our previous range
        const olderBids = await fetchUserBidsInRange(
          BigInt(0),
          startBlock - BigInt(1)
        );
        console.log(
          `✅ Comprehensive scan completed. Found ${olderBids.length} user bids in older blocks`
        );

        // Merge and deduplicate bids (using transaction hash as unique identifier)
        const allBids = [...fetchedBids, ...olderBids];
        fetchedBids = deduplicateBids(allBids);

        console.log(
          `🔧 After deduplication: ${fetchedBids.length} unique bids`
        );

        // Since we scanned everything from block 0, there's no more data to load
        setEarliestFetchedBlock(BigInt(0));
        setHasMoreData(false); // No more data - we've scanned everything from genesis block
        console.log(`🏁 Comprehensive scan complete - no more blocks to scan`);

        // Mark that we did a comprehensive scan for caching
        var didComprehensiveScan = true;
        var actualEarliestBlock = BigInt(0);
      } else if (fetchedBids.length > 0) {
        // Found bids in recent blocks - deduplicate and set up for potential "Load more"
        fetchedBids = deduplicateBids(fetchedBids);
        setEarliestFetchedBlock(startBlock);
        setHasMoreData(startBlock > BigInt(0)); // Show "Load more" only if there are older blocks
        console.log(
          `✅ Found bids in recent blocks. Can load ${
            startBlock > BigInt(0) ? "older blocks" : "no more blocks"
          }`
        );

        // Mark that we did a partial scan for caching
        var didComprehensiveScan = false;
        var actualEarliestBlock = startBlock;
      } else {
        // Edge case: no older blocks to scan and no bids found
        fetchedBids = deduplicateBids(fetchedBids);
        setEarliestFetchedBlock(startBlock);
        setHasMoreData(false);
        console.log(`ℹ️ No bids found and no older blocks to scan`);

        // Mark for caching
        var didComprehensiveScan = false;
        var actualEarliestBlock = startBlock;
      }

      console.log(`🎉 Total unique bids found: ${fetchedBids.length}`);

      // Sort by timestamp (newest first)
      fetchedBids.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Update state with results
      setUserBids(fetchedBids);
      setLatestFetchedBlock(latestBlock);

      // Cache the results with correct earliest block
      setCachedData(fetchedBids, latestBlock, actualEarliestBlock);

      console.log(`💾 Data cached for user: ${address}`);

      // Show success toast
      if (fetchedBids.length > 0) {
        toast.success(
          `Successfully found ${fetchedBids.length} bid${
            fetchedBids.length > 1 ? "s" : ""
          }!`
        );
      } else {
        toast.success("Scan completed - no bids found");
      }

      // Log the scanning result summary
      if (didComprehensiveScan) {
        console.log(
          `🏁 COMPLETE: Scanned all blocks (0 to ${latestBlock}) - found ${fetchedBids.length} bids`
        );
      } else if (fetchedBids.length > 0 && startBlock > BigInt(0)) {
        console.log(
          `📋 PARTIAL: Scanned recent blocks (${startBlock} to ${latestBlock}) - found ${fetchedBids.length} bids. Load more available.`
        );
      } else {
        console.log(
          `📋 COMPLETE: Scanned available blocks - found ${fetchedBids.length} bids`
        );
      }
    } catch (err) {
      console.error("❌ Error fetching user bids:", err);
      setError("Failed to fetch user bids. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to deduplicate bids based on transaction hash
  const deduplicateBids = (bids: BidEvent[]): BidEvent[] => {
    const seen = new Set<string>();
    const uniqueBids: BidEvent[] = [];

    for (const bid of bids) {
      if (!seen.has(bid.transactionHash)) {
        seen.add(bid.transactionHash);
        uniqueBids.push(bid);
        console.log(
          `✓ Added unique bid: ${bid.transactionHash.slice(0, 10)}...`
        );
      } else {
        console.log(
          `⚠️ Skipped duplicate bid: ${bid.transactionHash.slice(0, 10)}...`
        );
      }
    }

    return uniqueBids;
  };

  const fetchMoreUserBids = async () => {
    if (
      !address ||
      !publicClient ||
      !earliestFetchedBlock ||
      earliestFetchedBlock <= BigInt(0) ||
      loadingMore
    )
      return;

    console.log(
      `📚 Loading more bids. Current earliest block: ${earliestFetchedBlock}`
    );

    setLoadingMore(true);
    setError(null);

    try {
      // For the older data, go from block 0 to the earliest block we've already fetched
      const fromBlock = BigInt(0);
      const toBlock = earliestFetchedBlock - BigInt(1);

      console.log(`🔍 Fetching remaining blocks: ${fromBlock} to ${toBlock}`);

      // Check if there are more blocks to fetch
      if (fromBlock >= toBlock) {
        console.log(`ℹ️ No more blocks to fetch`);
        setHasMoreData(false);
        setLoadingMore(false);
        return;
      }

      // Fetch older bids
      const olderBids = await fetchUserBidsInRange(fromBlock, toBlock);
      console.log(
        `📊 Found ${olderBids.length} additional bids in remaining blocks`
      );

      // Merge and deduplicate all bids
      const allBids = [...userBids, ...olderBids];
      const uniqueBids = deduplicateBids(allBids);

      console.log(
        `🔧 After deduplication: ${uniqueBids.length} total unique bids`
      );

      // Sort by timestamp (newest first)
      uniqueBids.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      console.log(`🎉 Total bids now: ${uniqueBids.length}`);

      setUserBids(uniqueBids);
      setEarliestFetchedBlock(fromBlock);
      setHasMoreData(false); // No more data after fetching the oldest blocks

      // Update cache with all bids
      setCachedData(uniqueBids, latestFetchedBlock || BigInt(0), fromBlock);

      // Show success toast
      toast.success(
        `Successfully loaded all historical data! Found ${
          uniqueBids.length
        } total bid${uniqueBids.length > 1 ? "s" : ""}!`
      );
    } catch (err) {
      console.error("❌ Error fetching more user bids:", err);
      setError("Failed to fetch more bids. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchUserBidsInRange = async (
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<BidEvent[]> => {
    if (!address || !publicClient) return [];

    console.log(
      `🔎 Fetching bids in range: ${fromBlock} to ${toBlock} (${
        toBlock - fromBlock + BigInt(1)
      } blocks)`
    );

    const userBidLogs: BidEvent[] = [];
    let stats = {
      totalEvents: 0,
      userEvents: 0,
      processedBlocks: 1,
    };

    try {
      // First get all InsertBid events in this range
      console.log(
        `📡 Querying InsertBid events from contract: ${config.contracts.cacheManager.address}`
      );

      const logs = await publicClient.getLogs({
        address: config.contracts.cacheManager.address as `0x${string}`,
        event: parseAbiItem(
          "event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)"
        ),
        fromBlock,
        toBlock,
      });

      stats.totalEvents = logs.length;
      console.log(
        `📊 Found ${logs.length} total InsertBid events in this range`
      );

      // No logs found, return empty array
      if (logs.length === 0) {
        console.log(
          `ℹ️ No InsertBid events found in blocks ${fromBlock} to ${toBlock}`
        );
        return [];
      }

      console.log(
        `🔍 Processing events in batches of ${BATCH_SIZE}. Connected wallet: ${address}`
      );

      // Process events in larger batches for better performance
      for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const batch = logs.slice(i, i + BATCH_SIZE);
        console.log(
          `⚙️ Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
            logs.length / BATCH_SIZE
          )} (${batch.length} events)`
        );

        // Use Promise.all to fetch transactions in parallel
        const transactions = await Promise.all(
          batch.map((log) =>
            publicClient.getTransaction({ hash: log.transactionHash })
          )
        );

        console.log(
          `📥 Fetched ${transactions.length} transactions for current batch`
        );

        // Filter logs for transactions sent by the connected wallet
        const userLogsIndices = transactions
          .map((tx, idx) => {
            const isUserTransaction =
              tx.from.toLowerCase() === address.toLowerCase();
            if (isUserTransaction) {
              console.log(
                `✅ Found user transaction: ${tx.hash} (from: ${tx.from})`
              );
            }
            return isUserTransaction ? idx : -1;
          })
          .filter((idx) => idx !== -1);

        stats.userEvents += userLogsIndices.length;
        console.log(
          `👤 Found ${userLogsIndices.length} user transactions in this batch`
        );

        if (userLogsIndices.length === 0) {
          console.log(
            `⏭️ No user transactions in this batch, skipping to next`
          );
          continue;
        }

        // Get only logs that belong to the user
        const userLogs = userLogsIndices.map((idx) => batch[idx]);

        // Get unique block numbers to fetch timestamps
        const uniqueBlockNumbers = [
          ...new Set(userLogs.map((log) => log.blockNumber)),
        ];
        console.log(
          `🕒 Fetching timestamps for ${uniqueBlockNumbers.length} unique blocks`
        );

        // Create block number to timestamp mapping
        const blockTimestamps = new Map<string, number>();

        // Fetch block timestamps in parallel
        const blocks = await Promise.all(
          uniqueBlockNumbers.map((blockNum) =>
            publicClient.getBlock({ blockNumber: blockNum })
          )
        );

        // Map block numbers to timestamps
        blocks.forEach((block) => {
          blockTimestamps.set(block.number.toString(), Number(block.timestamp));
        });

        // Process user logs with timestamp information
        for (const log of userLogs) {
          const bidEvent = {
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            args: {
              codehash: log.args.codehash as string,
              program: log.args.program as string,
              bid: log.args.bid as bigint,
              size: log.args.size as bigint,
            },
            timestamp: blockTimestamps.get(log.blockNumber.toString()),
          };

          userBidLogs.push(bidEvent);
          console.log(
            `💰 Added user bid: ${formatEther(
              bidEvent.args.bid
            )} ETH for program ${formatAddress(
              bidEvent.args.program
            )} (tx: ${bidEvent.transactionHash.slice(0, 10)}...)`
          );
        }

        // Update stats for UI
        stats.processedBlocks = uniqueBlockNumbers.length;
        setLoadStats((prevStats) => ({
          totalEvents: prevStats.totalEvents + stats.totalEvents,
          userEvents: prevStats.userEvents + stats.userEvents,
          processedBlocks: prevStats.processedBlocks + stats.processedBlocks,
        }));
      }

      console.log(`🏁 Completed processing range ${fromBlock} to ${toBlock}`);
      console.log(
        `📈 Statistics: ${stats.totalEvents} total events, ${stats.userEvents} user events, ${stats.processedBlocks} blocks processed`
      );

      // Sort by timestamp (newest first)
      userBidLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return userBidLogs;
    } catch (error) {
      console.error(
        `❌ Error fetching bids in range ${fromBlock} to ${toBlock}:`,
        error
      );
      throw error;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUniqueContracts = () => {
    const uniqueContracts = new Set(userBids.map((bid) => bid.args.program));
    return uniqueContracts.size;
  };

  const getTotalBidAmount = () => {
    return userBids.reduce((total, bid) => total + bid.args.bid, BigInt(0));
  };

  // Calculate bid savings compared to minimum bid
  const calculateBidSavings = (bidValue: bigint) => {
    if (!minBidFromEntries) {
      return "N/A";
    }

    const savings = bidValue - minBidFromEntries;

    if (savings === BigInt(0)) {
      return "0 (Minimum)";
    } else if (savings > BigInt(0)) {
      return `+${savings.toString()}`;
    } else {
      return savings.toString();
    }
  };

  const clearCache = () => {
    if (!address) return;
    console.log(
      `🗑️ Clearing cache and refreshing data for address: ${address}`
    );

    // Clear cache
    localStorage.removeItem(CACHE_KEY_BIDS + address.toLowerCase());

    // Reset state
    setUserBids([]);
    setHasMoreData(true);
    setEarliestFetchedBlock(null);
    setLatestFetchedBlock(null);
    setAllEntries([]);
    setMinBidFromEntries(null);

    console.log(
      `🔄 Starting fresh scan - will check latest 2.5M blocks first, then older blocks if needed`
    );

    // Fetch all entries first, then user bids
    fetchAllEntries();
    fetchInitialUserBids();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to view your bidding dashboard.
          </p>
        </div>
      </div>
    );
  }

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

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Bidding Dashboard
              </h1>
              <p className="text-gray-600">
                Track your bids and contracts on the Cache Manager
              </p>
            </div>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Refresh Data
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Total Contracts</p>
                  <div className="text-2xl font-bold">
                    {getUniqueContracts()}
                  </div>
                </div>
                <Database className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-xs opacity-80">Contracts you've bid on</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Total Bids</p>
                  <div className="text-2xl font-bold">{userBids.length}</div>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-xs opacity-80">Bids placed</p>
            </div>
          </div>

          {/* Bids Table */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Bid History
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    {loadStats.userEvents === 0
                      ? "Scanning recent blocks for your bids..."
                      : loadStats.userEvents > 0
                      ? `Found ${loadStats.userEvents} bids! Loading details...`
                      : "Performing comprehensive blockchain scan..."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {userBids.length === 0 && loadStats.totalEvents > 0
                      ? "If no recent bids found, automatically scanning all historical blocks..."
                      : "This might take a while for comprehensive scanning"}
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={fetchInitialUserBids}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : userBids.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Bids Found</h3>
                  <p className="text-gray-600">
                    You haven't placed any bids in the recent blocks or none
                    were found.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Contract Address
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Bid
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Bid Savings
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Size
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Timestamp
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Transaction
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {userBids.map((bid, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                  {formatAddress(bid.args.program)}
                                </code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      bid.args.program
                                    );
                                    toast.success(
                                      "Contract address copied to clipboard!"
                                    );
                                  }}
                                  className="text-blue-500 hover:text-blue-700 text-xs transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                                {bid.args.bid.toString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                                  !minBidFromEntries
                                    ? "bg-gray-100 text-gray-800"
                                    : bid.args.bid === minBidFromEntries
                                    ? "bg-green-100 text-green-800"
                                    : bid.args.bid > minBidFromEntries
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {calculateBidSavings(bid.args.bid)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {bid.args.size.toString()} bytes
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatTimestamp(bid.timestamp)}
                            </td>
                            <td className="py-3 px-4">
                              <a
                                href={`https://sepolia.arbiscan.io/tx/${bid.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
                              >
                                View on Arbiscan
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Load more button */}
                  {hasMoreData && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={fetchMoreUserBids}
                        disabled={loadingMore}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            Loading older blocks (0 -{" "}
                            {earliestFetchedBlock?.toString()})...
                          </>
                        ) : (
                          <>
                            <ChevronLeft className="h-4 w-4" />
                            Load earliest blocks
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
