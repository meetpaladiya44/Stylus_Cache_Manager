"use client";

import { useState, useEffect } from 'react';
import { Trophy, Zap, DollarSign, Calendar, ExternalLink, Filter, Loader2, Wifi, WifiOff, RefreshCw, Database, AlertCircle, Wallet, Copy, Check } from 'lucide-react';

// Define interfaces for type safety
interface Contract {
  _id?: string;
  contractAddress: string;
  network: string;
  gasSaved: number;
  minBidRequired: number;
  deployedAt: string;
}

interface Stats {
  totalGasSaved: number;
  totalContracts: number;
  avgMinBid: number;
}

const LeaderboardDashboard: React.FC = () => {
  const [sortBy, setSortBy] = useState<'gasSaved' | 'minBidRequired' | 'deployedAt'>('gasSaved');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [data, setData] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalGasSaved: 0,
    totalContracts: 0,
    avgMinBid: 0,
  });
  const [networks, setNetworks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const getNetworkDisplayName = (network: string): string => {
    const displayNames: { [key: string]: string } = {
      'ethereum-mainnet': 'Ethereum Mainnet',
      'ethereum-sepolia': 'Ethereum Sepolia',
      'polygon': 'Polygon',
      'polygon-mumbai': 'Polygon Mumbai',
      'arbitrum-one': 'Arbitrum One',
      'arbitrum-sepolia': 'Arbitrum Sepolia',
    };
    return displayNames[network] || network;
  };

  // Copy contract address to clipboard
  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Fetch data from API
  const fetchLeaderboardData = async (network: string = selectedNetwork, sort: string = sortBy) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        network: network === 'all' ? 'all' : network,
        sortBy: sort,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/dashboard?${queryParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data');
      }

      setData(result.data || []);
      setStats(result.stats || { totalGasSaved: 0, totalContracts: 0, avgMinBid: 0 });
      setNetworks(result.networks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching leaderboard data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setRefreshing(false);
  };

  // Effect to fetch data on component mount and when filters change
  useEffect(() => {
    fetchLeaderboardData(selectedNetwork, sortBy);
  }, [selectedNetwork, sortBy]);

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNetworkColor = (network: string): string => {
    const colors: { [key: string]: string } = {
      'ethereum-mainnet': 'bg-blue-500/20 text-blue-300',
      'arbitrum-sepolia': 'bg-purple-500/20 text-purple-300',
      'arbitrum-one': 'bg-purple-500/20 text-purple-300',
      'polygon': 'bg-green-500/20 text-green-300',
      'polygon-mumbai': 'bg-green-500/20 text-green-300',
      'ethereum-sepolia': 'bg-blue-500/20 text-blue-300',
    };
    return colors[network] || 'bg-zinc-500/20 text-gray-300';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>;
  };

  // No Data Component with SVG illustration
  const NoDataFound = ({ network }: { network: string }) => (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-8">
        <svg width="200" height="160" viewBox="0 0 200 160" className="mx-auto opacity-60">
          {/* Database icon */}
          <ellipse cx="100" cy="40" rx="60" ry="15" fill="#374151" stroke="#6B7280" strokeWidth="2" />
          <rect x="40" y="40" width="120" height="60" rx="5" fill="#374151" stroke="#6B7280" strokeWidth="2" />
          <ellipse cx="100" cy="100" rx="60" ry="15" fill="#374151" stroke="#6B7280" strokeWidth="2" />

          {/* Search/magnifying glass */}
          <circle cx="140" cy="120" r="12" fill="none" stroke="#6B7280" strokeWidth="3" />
          <line x1="149" y1="129" x2="160" y2="140" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />

          {/* X mark inside search */}
          <line x1="134" y1="114" x2="146" y2="126" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="146" y1="114" x2="134" y2="126" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

          {/* Network indicators */}
          <circle cx="70" cy="60" r="3" fill="#6B7280" />
          <circle cx="100" cy="65" r="3" fill="#6B7280" />
          <circle cx="130" cy="60" r="3" fill="#6B7280" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-gray-300 mb-3">
        No Contracts Found
      </h3>

      <p className="text-gray-400 mb-6 max-w-md">
        {network === 'all'
          ? 'No contracts are currently available in the leaderboard.'
          : `No contracts found on ${getNetworkDisplayName(network)} network. Try switching to a different network or view all networks.`
        }
      </p>

      {network !== 'all' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setSelectedNetwork('all')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            View All Networks
          </button>
        </div>
      )}
    </div>
  );

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Top performing contracts ranked by gas optimization</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">Error: {error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'gasSaved' | 'minBidRequired' | 'deployedAt')}
              className="bg-zinc-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gasSaved">Sort by Gas Saved</option>
              <option value="minBidRequired">Sort by Min Bid</option>
              <option value="deployedAt">Sort by Deploy Date</option>
            </select>
          </div>

          {/* <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="bg-zinc-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Networks</option>
            {networks.map((network) => (
              <option key={network} value={network}>
                {getNetworkDisplayName(network)}
              </option>
            ))}
          </select> */}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Gas Saved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.totalGasSaved?.toLocaleString() || '0'}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Contracts</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalContracts || 0}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Bid Amount</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {stats.avgMinBid?.toFixed(3) || '0.000'} ETH
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-zinc-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          )}

          {data.length === 0 && !loading ? (
            <NoDataFound network={selectedNetwork} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/50 border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Rank</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Contract</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Network</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Gas Saved</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Bid Amount</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Deployed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((contract, index) => (
                    <tr
                      key={contract.contractAddress || contract._id}
                      className="border-b border-gray-700/50 hover:bg-zinc-700/20 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          {getRankIcon(index)}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-mono text-sm flex items-center gap-2">
                          <span className="text-white">{formatAddress(contract.contractAddress)}</span>
                          <button
                            onClick={() => copyToClipboard(contract.contractAddress)}
                            className="p-1 rounded hover:bg-zinc-700/50 transition-colors duration-200 group relative"
                            title="Copy contract address"
                          >
                            {copiedAddress === contract.contractAddress ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                            )}
                          </button>
                          {copiedAddress === contract.contractAddress && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap animate-fade-in">
                              Copied!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNetworkColor(contract.network)}`}>
                          {getNetworkDisplayName(contract.network)}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            {parseInt(String(contract.gasSaved)).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">
                            {contract.minBidRequired} ETH
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(contract.deployedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Last updated: {new Date().toLocaleString()}
          {selectedNetwork !== 'all' && (
            <span className="ml-4">
              • Showing data for: <span className="text-purple-400 font-medium">
                {getNetworkDisplayName(selectedNetwork)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardDashboard;