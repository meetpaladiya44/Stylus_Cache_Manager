"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { cacheManagerConfig } from '@/config/CacheManagerConfig';
import { parseAbiItem, formatEther } from 'viem';
import { Database, TrendingUp, Clock, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

// Cache keys
const CACHE_KEY_BIDS = 'user_bids_cache_';
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
  const [earliestFetchedBlock, setEarliestFetchedBlock] = useState<bigint | null>(null);
  const [latestFetchedBlock, setLatestFetchedBlock] = useState<bigint | null>(null);
  const [loadStats, setLoadStats] = useState<{
    totalEvents: number;
    userEvents: number;
    processedBlocks: number;
  }>({
    totalEvents: 0,
    userEvents: 0,
    processedBlocks: 0
  });

  const config = cacheManagerConfig.arbitrum_one;

  useEffect(() => {
    if (isConnected && address && publicClient) {
      // Clear data when address changes
      setUserBids([]);
      setHasMoreData(true);
      setEarliestFetchedBlock(null);
      setLatestFetchedBlock(null);
      
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setUserBids(cachedData.bids);
        setEarliestFetchedBlock(BigInt(cachedData.earliestFetchedBlock));
        setLatestFetchedBlock(BigInt(cachedData.latestBlock));
        setHasMoreData(BigInt(cachedData.earliestFetchedBlock) > BigInt(0));
      } else {
        fetchInitialUserBids();
      }
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
        size: bid.args.size.toString()
      },
      timestamp: bid.timestamp
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
        size: BigInt(serialized.args.size)
      },
      timestamp: serialized.timestamp
    };
  };

  const getCachedData = (): { bids: BidEvent[], latestBlock: string, earliestFetchedBlock: string } | null => {
    if (!address) return null;
    
    try {
      const cacheKey = CACHE_KEY_BIDS + address.toLowerCase();
      const cachedDataString = localStorage.getItem(cacheKey);
      
      if (!cachedDataString) return null;
      
      const cachedData = JSON.parse(cachedDataString) as CacheData;
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cachedData.timestamp <= CACHE_EXPIRY_TIME) {
        // Convert serialized data back to BigInt format
        const bids = cachedData.bids.map(serializableToBid);
        return {
          bids,
          latestBlock: cachedData.latestBlock,
          earliestFetchedBlock: cachedData.earliestFetchedBlock
        };
      }
      
      // Cache expired
      localStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error('Error accessing cache:', error);
      localStorage.removeItem(CACHE_KEY_BIDS + address.toLowerCase());
      return null;
    }
  };

  const setCachedData = (bids: BidEvent[], latestBlock: bigint, earliestBlock: bigint) => {
    if (!address) return;
    
    try {
      const cacheKey = CACHE_KEY_BIDS + address.toLowerCase();
      
      // Convert BigInt to string before serialization
      const serializableBids = bids.map(bidToSerializable);
      
      const cacheData: CacheData = {
        bids: serializableBids,
        timestamp: Date.now(),
        latestBlock: latestBlock.toString(),
        earliestFetchedBlock: earliestBlock.toString()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const fetchInitialUserBids = async () => {
    if (!address || !publicClient) return;

    setLoading(true);
    setError(null);
    setLoadStats({
      totalEvents: 0,
      userEvents: 0,
      processedBlocks: 0
    });
    
    try {
      // Get the latest block number
      const latestBlock = await publicClient.getBlockNumber();
      
      // Start by fetching most recent 2.5 million blocks
      const fromBlock = latestBlock - BigInt(INITIAL_BLOCKS_RANGE);
      const startBlock = fromBlock > BigInt(0) ? fromBlock : BigInt(0);
      
      const fetchedBids = await fetchUserBidsInRange(startBlock, latestBlock);
      
      // Update state with initial results
      setUserBids(fetchedBids);
      setEarliestFetchedBlock(startBlock);
      setLatestFetchedBlock(latestBlock);
      setHasMoreData(startBlock > BigInt(0));
      
      // Cache the results
      setCachedData(fetchedBids, latestBlock, startBlock);
    } catch (err) {
      console.error('Error fetching user bids:', err);
      setError('Failed to fetch user bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreUserBids = async () => {
    if (!address || !publicClient || !earliestFetchedBlock || earliestFetchedBlock <= BigInt(0) || loadingMore) return;

    setLoadingMore(true);
    setError(null);
    
    try {
      // For the older data, go from block 0 to the earliest block we've already fetched
      const fromBlock = BigInt(0);
      const toBlock = earliestFetchedBlock - BigInt(1);
      
      // Check if there are more blocks to fetch
      if (fromBlock >= toBlock) {
        setHasMoreData(false);
        setLoadingMore(false);
        return;
      }
      
      // Fetch older bids
      const olderBids = await fetchUserBidsInRange(fromBlock, toBlock);
      
      // Add to existing bids and update state
      const allBids = [...userBids, ...olderBids];
      
      // Sort again by timestamp (newest first)
      allBids.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      setUserBids(allBids);
      setEarliestFetchedBlock(fromBlock);
      setHasMoreData(false); // No more data after fetching the oldest blocks
      
      // Update cache with all bids
      setCachedData(allBids, latestFetchedBlock || BigInt(0), fromBlock);
    } catch (err) {
      console.error('Error fetching more user bids:', err);
      setError('Failed to fetch more bids. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchUserBidsInRange = async (fromBlock: bigint, toBlock: bigint): Promise<BidEvent[]> => {
    if (!address || !publicClient) return [];
    
    const userBidLogs: BidEvent[] = [];
    let stats = {
      totalEvents: 0,
      userEvents: 0,
      processedBlocks: 1
    };
    
    try {
      // First get all InsertBid events in this range
      const logs = await publicClient.getLogs({
        address: config.contracts.cacheManager.address as `0x${string}`,
        event: parseAbiItem('event InsertBid(bytes32 indexed codehash, address program, uint192 bid, uint64 size)'),
        fromBlock,
        toBlock
      });
      
      stats.totalEvents = logs.length;
      
      // No logs found, return empty array
      if (logs.length === 0) return [];
      
      // Process events in larger batches for better performance
      for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const batch = logs.slice(i, i + BATCH_SIZE);
        
        // Use Promise.all to fetch transactions in parallel
        const transactions = await Promise.all(
          batch.map(log => 
            publicClient.getTransaction({ hash: log.transactionHash })
          )
        );
        
        // Filter logs for transactions sent by the connected wallet
        const userLogsIndices = transactions
          .map((tx, idx) => tx.from.toLowerCase() === address.toLowerCase() ? idx : -1)
          .filter(idx => idx !== -1);
        
        stats.userEvents += userLogsIndices.length;
        
        if (userLogsIndices.length === 0) continue;
        
        // Get only logs that belong to the user
        const userLogs = userLogsIndices.map(idx => batch[idx]);
        
        // Get unique block numbers to fetch timestamps
        const uniqueBlockNumbers = [...new Set(userLogs.map(log => log.blockNumber))];
        
        // Create block number to timestamp mapping
        const blockTimestamps = new Map<string, number>();
        
        // Fetch block timestamps in parallel
        const blocks = await Promise.all(
          uniqueBlockNumbers.map(blockNum => 
            publicClient.getBlock({ blockNumber: blockNum })
          )
        );
        
        // Map block numbers to timestamps
        blocks.forEach(block => {
          blockTimestamps.set(block.number.toString(), Number(block.timestamp));
        });
        
        // Process user logs with timestamp information
        for (const log of userLogs) {
          userBidLogs.push({
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            args: {
              codehash: log.args.codehash as string,
              program: log.args.program as string,
              bid: log.args.bid as bigint,
              size: log.args.size as bigint
            },
            timestamp: blockTimestamps.get(log.blockNumber.toString())
          });
        }
        
        // Update stats for UI
        stats.processedBlocks = uniqueBlockNumbers.length;
        setLoadStats(prevStats => ({
          totalEvents: prevStats.totalEvents + stats.totalEvents,
          userEvents: prevStats.userEvents + stats.userEvents,
          processedBlocks: prevStats.processedBlocks + stats.processedBlocks
        }));
      }
      
      // Sort by timestamp (newest first)
      userBidLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      return userBidLogs;
    } catch (error) {
      console.error("Error fetching bids in range:", error);
      throw error;
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUniqueContracts = () => {
    const uniqueContracts = new Set(userBids.map(bid => bid.args.program));
    return uniqueContracts.size;
  };

  const getTotalBidAmount = () => {
    return userBids.reduce((total, bid) => total + bid.args.bid, BigInt(0));
  };

  const clearCache = () => {
    if (!address) return;
    localStorage.removeItem(CACHE_KEY_BIDS + address.toLowerCase());
    setUserBids([]);
    setHasMoreData(true);
    setEarliestFetchedBlock(null);
    setLatestFetchedBlock(null);
    fetchInitialUserBids();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your bidding dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bidding Dashboard</h1>
            <p className="text-gray-600">Track your bids and contracts on the Cache Manager</p>
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
                <div className="text-2xl font-bold">{getUniqueContracts()}</div>
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

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-80">Total Amount</p>
                <div className="text-2xl font-bold">
                  {formatEther(getTotalBidAmount())} ETH
                </div>
              </div>
              <Wallet className="h-8 w-8 opacity-80" />
            </div>
            <p className="text-xs opacity-80">Total bid amount</p>
          </div>
        </div>

        {/* Bids Table */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Bid History
            </h2>
            {loading && (
              <div className="text-xs text-gray-500 mt-2">
                Scanned {loadStats.totalEvents} events, found {loadStats.userEvents} bids across {loadStats.processedBlocks} blocks
              </div>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your bids from latest blocks...</p>
                <p className="text-sm text-gray-500 mt-1">This might take a while</p>
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
                <p className="text-gray-600">You haven't placed any bids in the recent blocks or none were found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Contract Address</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Bid Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBids.map((bid, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                {formatAddress(bid.args.program)}
                              </code>
                              <button 
                                onClick={() => navigator.clipboard.writeText(bid.args.program)}
                                className="text-blue-500 hover:text-blue-700 text-xs transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                              {formatEther(bid.args.bid)} ETH
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{bid.args.size.toString()} bytes</td>
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
                          Loading older blocks (0 - {earliestFetchedBlock?.toString()})...
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
  );
};

export default UserDashboard; 