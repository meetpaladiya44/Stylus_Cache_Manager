"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Contract } from "../api/profile/contracts/route";

interface BalanceDeposit {
  _id: string;
  userWalletAddress: string;
  txHash: string;
  network: string;
  minBalanceValue: string;
  timestamp: string;
  dynamicUpdatedBalVal: string;
  totalGasCost: string;
  bidCharges?: string;
}

interface ProfileStats {
  totalContracts: number;
  totalGasSaved: string;
  totalGasUsed: string;
  activeContracts: number;
}

type SortField =
  | "contractAddress"
  | "network"
  | "deployedAt"
  | "evictionThresholdDate"
  | "gasSaved"
  | "gasUsed";
type SortDirection = "asc" | "desc";

export default function ProfilePage() {
  const { address, isConnected, isConnecting } = useAccount();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [balanceDeposits, setBalanceDeposits] = useState<BalanceDeposit[]>([]);
  const [sortedContracts, setSortedContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("deployedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalContracts: 0,
    totalGasSaved: "0",
    totalGasUsed: "0",
    activeContracts: 0,
  });

  useEffect(() => {
    if (isConnected && address) {
      fetchUserContracts();
    } else {
      // Reset state when wallet is disconnected
      setContracts([]);
      setSortedContracts([]);
      setStats({
        totalContracts: 0,
        totalGasSaved: "0",
        totalGasUsed: "0",
        activeContracts: 0,
      });
      setError(null);
    }
  }, [isConnected, address]);

  // Sort contracts whenever contracts or sort parameters change
  useEffect(() => {
    const sorted = [...contracts].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle numeric fields
      if (sortField === "gasSaved" || sortField === "gasUsed") {
        aValue = parseInt(aValue || "0");
        bValue = parseInt(bValue || "0");
      }

      // Handle date fields
      if (sortField === "deployedAt" || sortField === "evictionThresholdDate") {
        aValue = parseISOToUTCTimestamp(aValue);
        bValue = parseISOToUTCTimestamp(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setSortedContracts(sorted);
  }, [contracts, sortField, sortDirection]);

  // Toast auto-hide effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUserContracts = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/profile/contracts?walletAddress=${address}`
      );
      const data = await response.json();

      if (data.success) {
        setContracts(data.contracts);
        setBalanceDeposits(data.balanceDeposits || []);
        calculateStats(data.contracts);
      } else {
        setError(data.error || "Failed to fetch contracts");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (contractsData: Contract[]) => {
    const now = new Date();
    const activeContracts = contractsData.filter(
      (contract) => new Date(contract.evictionThresholdDate) > now
    ).length;

    const totalGasSaved = contractsData.reduce(
      (sum, contract) => sum + parseInt(contract.gasSaved || "0"),
      0
    );

    const totalGasUsed = contractsData.reduce(
      (sum, contract) => sum + parseInt(contract.gasUsed || "0"),
      0
    );

    setStats({
      totalContracts: contractsData.length,
      totalGasSaved: totalGasSaved.toLocaleString(),
      totalGasUsed: totalGasUsed.toLocaleString(),
      activeContracts,
    });
  };

  // Robust ISO parser that tolerates a space before 'T' and always constructs a UTC date
  const parseISOToUTCTimestamp = (raw: string | undefined | null): number => {
    if (!raw || typeof raw !== "string") return 0;
    const s = raw.trim().replace(/\sT/i, "T");

    // Match: YYYY-MM-DD[T ]HH:mm[:ss][.SSS][Z]
    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s]?(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z)?$/i
    );
    if (!m) {
      const t = Date.parse(s);
      return isNaN(t) ? 0 : t;
    }
    const [_, yyyy, mm, dd, HH, MM, SS = "0", MS = "0"] = m;
    const ts = Date.UTC(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(HH),
      Number(MM),
      Number(SS),
      Number(MS.padEnd(3, "0"))
    );
    return ts;
  };

  const getBidChargesForNetwork = (network: string) => {
    const deposit = balanceDeposits.find(deposit => deposit.network === network);
    return deposit?.bidCharges || "0";
  };

  const getTotalBidCharges = () => {
    return balanceDeposits.reduce((total, deposit) => {
      return total + parseFloat(deposit.bidCharges || "0");
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const ts = parseISOToUTCTimestamp(dateString);
    if (!ts) return "-";
    const d = new Date(ts);
    // Render in user's local timezone
    return d.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusBadge = (evictionDate: string) => {
    const now = new Date();
    const threshold = new Date(evictionDate);
    const isActive = threshold > now;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        }`}
      >
        {isActive ? "Active" : "Expired"}
      </span>
    );
  };

  const getNetworkBadge = (network: string) => {
    const networkColors: { [key: string]: string } = {
      "arbitrum-one":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "arbitrum-sepolia":
        "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          networkColors[network] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
        }`}
      >
        {network.replace("-", " ").toUpperCase()}
      </span>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const baseUrls: { [key: string]: string } = {
      "arbitrum-one": "https://arbiscan.io/tx/",
      "arbitrum-sepolia": "https://sepolia.arbiscan.io/tx/",
    };

    return `${baseUrls[network] || "https://arbiscan.io/tx/"}${txHash}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `${type} copied to clipboard!`, type: "success" });
    } catch (err) {
      setToast({ message: `Failed to copy ${type}`, type: "error" });
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // Show wallet connection prompt if not connected
  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8">
              <div className="text-slate-400 mb-6">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-slate-400 mb-6">
                Please connect your wallet to view your smart cache contracts
                and profile data.
              </p>
              <div className="text-sm text-slate-500">
                Use the wallet connection button in the navigation to get
                started.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while connecting or fetching data
  if (isConnecting || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-zinc-800/50 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-zinc-800/50 rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-zinc-800/50 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-zinc-800/50 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-700/50 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-zinc-700/50 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="p-3 bg-zinc-700/50 rounded-lg">
                    <div className="w-6 h-6 bg-zinc-600/50 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-zinc-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="h-6 bg-zinc-700/50 rounded w-1/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-zinc-700/50 rounded w-1/3 animate-pulse"></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/50 border-b border-gray-700">
                    {[
                      "Contract",
                      "Network",
                      "Status",
                      "Gas Metrics",
                      "Deployed",
                      "Expires",
                      "Actions",
                    ].map((header, i) => (
                      <th key={i} className="px-6 py-3 text-left">
                        <div className="h-4 bg-zinc-600/50 rounded w-20 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="h-4 bg-zinc-700/50 rounded w-24 mb-1 animate-pulse"></div>
                            <div className="h-3 bg-zinc-700/50 rounded w-20 animate-pulse"></div>
                          </div>
                          <div className="h-4 w-4 bg-zinc-700/50 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-zinc-700/50 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-zinc-700/50 rounded w-16 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 bg-zinc-700/50 rounded w-12 animate-pulse"></div>
                          <div className="h-4 bg-zinc-700/50 rounded w-1 animate-pulse"></div>
                          <div className="h-4 bg-zinc-700/50 rounded w-12 animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-700/50 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-700/50 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-4 w-4 bg-zinc-700/50 rounded animate-pulse"></div>
                          <div className="h-4 w-4 bg-zinc-700/50 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Profile Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and monitor your smart cache contracts
          </p>
          {isConnected && address && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Connected:
              </span>
              <code className="bg-slate-200 px-2 py-1 rounded text-sm font-mono">
                {formatAddress(address)}
              </code>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-800/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Contracts
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalContracts}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Contracts
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.activeContracts}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Gas Saved
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalGasSaved}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Gas Used
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.totalGasUsed}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bid Charges Display */}
        {balanceDeposits.length > 0 && (
          <div className="mb-8">
            <div className="bg-zinc-800/50 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Bid Charges by Network
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {balanceDeposits.map((deposit) => (
                  <div key={deposit._id} className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-300">
                        {deposit.network.replace("-", " ").toUpperCase()}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {deposit.bidCharges || "0"} ETH
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-300">
                    Total Bid Charges:
                  </span>
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {getTotalBidCharges()} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contracts Table */}
        <div className="bg-zinc-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Your Contracts
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          </div>

          {error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{error}</p>
              <button
                onClick={fetchUserContracts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No contracts found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                You haven't deployed any smart cache contracts yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/30">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort("contractAddress")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Contract</span>
                        {getSortIcon("contractAddress")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort("network")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Network</span>
                        {getSortIcon("network")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort("gasSaved")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Gas Metrics</span>
                        {getSortIcon("gasSaved")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort("deployedAt")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Deployed</span>
                        {getSortIcon("deployedAt")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort("evictionThresholdDate")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Expires</span>
                        {getSortIcon("evictionThresholdDate")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedContracts.map((contract) => (
                    <tr
                      key={contract._id}
                      className="border-b border-gray-700/50 hover:bg-zinc-700/20 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {formatAddress(contract.contractAddress)}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              Min Bid: {contract.minBidRequired} ETH
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                contract.contractAddress,
                                "Contract address"
                              )
                            }
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Copy contract address"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getNetworkBadge(contract.network)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.evictionThresholdDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 dark:text-green-400">
                              + {parseInt(contract.gasSaved).toLocaleString()}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-orange-600 dark:text-orange-400">
                              - {parseInt(contract.gasUsed).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(contract.deployedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(contract.evictionThresholdDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              window.open(
                                getExplorerUrl(
                                  contract.network,
                                  contract.txHash
                                ),
                                "_blank"
                              )
                            }
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="View transaction on explorer"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                getExplorerUrl(
                                  contract.network,
                                  contract.txHash
                                ),
                                "Transaction URL"
                              )
                            }
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            title="Copy transaction URL"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`px-6 py-3 rounded-lg shadow-lg border ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="flex items-center space-x-2">
                {toast.type === "success" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span className="font-medium">{toast.message}</span>
                <button
                  onClick={() => setToast(null)}
                  className="ml-2 text-current hover:opacity-70 transition-opacity"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
