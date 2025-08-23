"use client";

import { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Zap,
  Loader2,
  RefreshCw,
  Database,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import Pagination from "../components/Pagination";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorBoundary";
import { usePagination } from "../hooks/usePagination";

// Define interfaces for type safety
interface Contract {
  _id?: string;
  contractAddress: string;
  network: string;
  gasSaved: number;
  minBidRequired: number;
  deployedBy: string;
  usingUI?: boolean;
  byCLI?: boolean;
  usingAutoCacheFlag?: boolean;
  txHash: string;
  evictionThresholdDate?: string;
  bidPlacedAt?: string;
}

interface Stats {
  totalGasSaved: number;
  totalContracts: number;
  avgMinBid: number;
  uniqueDeployers: number;
}

interface NetworkStats {
  mainnetContracts: number;
  testnetContracts: number;
  totalMainnetGasSaved: number;
  totalTestnetGasSaved: number;
}

interface Pagination {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  hasPrev: boolean;
}

type SortField =
  | "rank"
  | "deployedVia"
  | "network"
  | "gasSaved"
  | "minBidRequired";

type SortDirection = "asc" | "desc";

const LeaderboardDashboard: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [data, setData] = useState<Contract[]>([]);
  const [sortedData, setSortedData] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalGasSaved: 0,
    totalContracts: 0,
    avgMinBid: 0,
    uniqueDeployers: 0,
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    mainnetContracts: 0,
    testnetContracts: 0,
    totalMainnetGasSaved: 0,
    totalTestnetGasSaved: 0,
  });
  const [networkStatsLoaded, setNetworkStatsLoaded] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [networks, setNetworks] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [sortField, setSortField] = useState<SortField>("gasSaved");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // ✅ FIXED: Add scroll position preservation
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // ✅ FIXED: Enhanced pagination hook with improved scroll preservation
  const {
    pagination,
    currentPage,
    isLoading: pageLoading,
    error,
    goToPage,
    setPaginationData,
    setLoading,
    setError,
    reset: resetPagination,
  } = usePagination({
    initialPage: 1,
    initialLimit: 50,
    onPageChange: async (page: number) => {
      try {
        // Store current scroll position before page change
        const currentScroll = window.scrollY;
        setScrollPosition(currentScroll);
        
        console.log(`🔄 Changing to page ${page}`);
        
                 // Fetch new data with current sort settings
         const sortFieldMapping: { [key in SortField]: string } = {
           "rank": "gasSaved",
           "deployedVia": "deployedVia",
           "network": "network",
           "gasSaved": "gasSaved",
           "minBidRequired": "minBidRequired"
         };
         const apiSortField = sortFieldMapping[sortField];
         await fetchLeaderboardData(selectedNetwork, apiSortField, page, sortDirection);
        
        // ✅ FIXED: Use requestAnimationFrame for smooth scroll restoration without causing re-renders
        requestAnimationFrame(() => {
          window.scrollTo({
            top: currentScroll,
            behavior: 'auto'
          });
        });
        
        console.log(`✅ Page ${page} loaded successfully`);
      } catch (error) {
        console.error(`❌ Error loading page ${page}:`, error);
        throw error; // Re-throw to let pagination component handle it
      }
    },
  });

  const getNetworkDisplayName = (network: string): string => {
    const displayNames: { [key: string]: string } = {
      "arbitrum-one": "Arbitrum One",
      "arbitrum-sepolia": "Arbitrum Sepolia",
    };
    return displayNames[network] || network;
  };

  // Copy contract address to clipboard
  const copyToClipboard = async (
    address: string,
    type: "contract" | "deployer",
    rowId: string
  ) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(`${type}-${rowId}`);
      setTimeout(() => setCopiedAddress(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy address:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedAddress(`${type}-${rowId}`);
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // ✅ FIXED: Add request tracking to prevent duplicate API calls
  const currentApiRequest = useRef<Promise<void> | null>(null);
  const isApiCallInProgress = useRef<boolean>(false);

     // ✅ FIXED: Fetch data from API with global sorting support and duplicate call prevention
  const fetchLeaderboardData = async (
    network: string = selectedNetwork,
     sort: string = "gasSaved", 
     page: number = currentPage,
     sortOrder: SortDirection = "desc" // ✅ FIXED: Add sortOrder parameter
  ): Promise<void> => {
     // Prevent duplicate API calls
     if (isApiCallInProgress.current) {
       console.log('⏸️ API call already in progress, skipping duplicate');
       return;
     }
 
     try {
       isApiCallInProgress.current = true;
      setError(null);
       
       console.log(`📡 GLOBAL API Call: page=${page}, network=${network}, sort=${sort}, order=${sortOrder}`);

      const queryParams = new URLSearchParams({
        network: network === "all" ? "all" : network,
        sortBy: sort,
         sortOrder: sortOrder, // ✅ FIXED: Use dynamic sortOrder
        page: page.toString(),
        limit: "50",
      });

      const response = await fetch(`/api/dashboard?${queryParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch data");
      }

      const contractsData = result.data || [];
      
      // ✅ FIXED: Batch state updates to prevent multiple re-renders
      setData(contractsData);
      setStats(
        result.stats || {
          totalGasSaved: 0,
          totalContracts: 0,
          avgMinBid: 0,
          uniqueDeployers: 0,
        }
      );
      
      setNetworks(result.networks || []);

      // Update pagination data using the hook
      setPaginationData({
        total: result.pagination?.total || 0,
        limit: result.pagination?.limit || 50,
        page: result.pagination?.page || 1,
        totalPages: result.pagination?.totalPages || 0,
        hasMore: result.pagination?.hasMore || false,
        hasPrev: result.pagination?.hasPrev || false,
      });

      // Set initial loading to false once first data arrives
      setInitialLoading(false);
      
      console.log(`✅ API Success: page=${page}, contracts=${contractsData.length}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("❌ API Error:", err);
      setData([]);
      // Set initial loading to false even on error
      setInitialLoading(false);
    } finally {
      isApiCallInProgress.current = false;
    }
  };

  // This ensures mainnet/testnet counts don't change when paginating
  const fetchNetworkTotals = async (): Promise<void> => {
    try {
      const [mainnetResponse, testnetResponse] = await Promise.all([
        fetch('/api/dashboard?network=arbitrum-one&limit=1'),
        fetch('/api/dashboard?network=arbitrum-sepolia&limit=1')
      ]);
      
      const [mainnetResult, testnetResult] = await Promise.all([
        mainnetResponse.json(),
        testnetResponse.json()
      ]);
      
      if (mainnetResult.success && testnetResult.success) {
        setNetworkStats({
          mainnetContracts: mainnetResult.stats?.totalContracts || 0,
          testnetContracts: testnetResult.stats?.totalContracts || 0,
          totalMainnetGasSaved: mainnetResult.stats?.totalGasSaved || 0,
          totalTestnetGasSaved: testnetResult.stats?.totalGasSaved || 0,
        });
        setNetworkStatsLoaded(true);
        console.log('⚡ Network stats loaded:', {
          mainnet: mainnetResult.stats?.totalContracts || 0,
          testnet: testnetResult.stats?.totalContracts || 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching network totals:', error);
      // Set defaults on error
      setNetworkStats({
        mainnetContracts: 0,
        testnetContracts: 0,
        totalMainnetGasSaved: 0,
        totalTestnetGasSaved: 0,
      });
      setNetworkStatsLoaded(true);
    }
  };

  // Refresh data - OPTIMIZED with parallel requests!
  const handleRefresh = async () => {
    setRefreshing(true);
    const refreshStartTime = performance.now();
    
         await Promise.all([
       fetchLeaderboardData(selectedNetwork, "gasSaved", currentPage, "desc"),
       fetchNetworkTotals() // Also refresh network totals in parallel
     ]);
    
    const refreshEndTime = performance.now();
    console.log(`⚡ Dashboard refresh completed: ${(refreshEndTime - refreshStartTime).toFixed(2)}ms`);
    setRefreshing(false);
  };

  // Effect to fetch network totals once on component mount
  useEffect(() => {
    if (!networkStatsLoaded) {
      fetchNetworkTotals();
    }
  }, [networkStatsLoaded]);

  // Effect to fetch data on component mount and when filters change
  useEffect(() => {
    resetPagination(); // Reset pagination when filters change
    setInitialLoading(true); // Set initial loading when filters change
         fetchLeaderboardData(selectedNetwork, "gasSaved", 1, "desc");
  }, [selectedNetwork, resetPagination]);

  // Toast auto-hide effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ✅ FIXED: Remove client-side sorting - data comes pre-sorted from API globally across ALL records
  useEffect(() => {
    // Simply use the data as-is since it comes pre-sorted from the API globally
    setSortedData(data);
  }, [data]);

  // ✅ PERFORMANCE: Optimized sorting with minimal loading states
  const [sortingField, setSortingField] = useState<SortField | null>(null);
  
  const handleSort = async (field: SortField) => {
    let newSortDirection: SortDirection;
    
    if (sortField === field) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newSortDirection);
    } else {
      setSortField(field);
      newSortDirection = "desc"; // ✅ Default to desc for better UX (highest first)
      setSortDirection(newSortDirection);
    }

    // ✅ PERFORMANCE: Show minimal sorting indicator instead of full loading
    setSortingField(field);
    
    // ✅ SIMPLIFIED: Map frontend sort fields to API sort fields for GLOBAL database sorting
    const sortFieldMapping: { [key in SortField]: string } = {
      "rank": "gasSaved", // Rank is based on gas saved (global ranking)
      "deployedVia": "deployedVia", // ✅ Will handle CLI/UI/Rust crate sorting in API
      "network": "network",
      "gasSaved": "gasSaved",
      "minBidRequired": "minBidRequired"
    };

    const apiSortField = sortFieldMapping[field];
    const startTime = performance.now();
    console.log(`⚡ LIGHTNING SORT: ${field} → ${apiSortField} (${newSortDirection}) across ALL ${stats.totalContracts} contracts`);
    
    try {
      // ✅ PERFORMANCE: Reset to page 1 + fetch with optimized loading
      resetPagination(); // Reset pagination state
      // ✅ Don't show initialLoading for sorts - use minimal indicator instead
      await fetchLeaderboardData(selectedNetwork, apiSortField, 1, newSortDirection);
      
      const endTime = performance.now();
      console.log(`🚀 Sort completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('❌ Error during global sort:', error);
      setError('Failed to sort data. Please try again.');
    } finally {
      setSortingField(null); // Clear sorting indicator
    }
  };

  // ✅ PERFORMANCE: Smart sort icon with loading indicator
  const getSortIcon = (field: SortField) => {
    // Show loading spinner for currently sorting field
    if (sortingField === field) {
      return (
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
      );
    }
    
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors"
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
        className="w-4 h-4 text-blue-400"
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
        className="w-4 h-4 text-blue-400"
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

     // ✅ FIXED: Calculate active contracts count (contracts that haven't expired)
   const getActiveContractsCount = (): number => {
     if (!data || data.length === 0) return 0;
     
     const currentDate = new Date();
     let activeInCurrentPage = 0;
     
     data.forEach((contract: Contract) => {
       const expiryDate = getContractExpiryDate(contract);
       if (expiryDate && expiryDate > currentDate) {
         activeInCurrentPage++;
       }
     });
     
     // Estimate total active contracts based on current page ratio
     const activeRatio = data.length > 0 ? activeInCurrentPage / data.length : 0;
     return Math.round(stats.totalContracts * activeRatio);
   };

   // Calculate enhanced stats with mainnet/testnet breakdown from total stats
   const getEnhancedStats = () => {
     const activeCount = getActiveContractsCount();
     
     return {
       mainnet: {
         total: networkStats.mainnetContracts,
         active: Math.round(networkStats.mainnetContracts * (activeCount / stats.totalContracts)),
       },
       testnet: {
         total: networkStats.testnetContracts,
         active: Math.round(networkStats.testnetContracts * (activeCount / stats.totalContracts)),
       },
       total: {
         contracts: stats.totalContracts,
         active: activeCount,
       }
     };
   };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get explorer URL for network-specific block explorers
  const getExplorerUrl = (network: string, txHash: string) => {
    const baseUrls: { [key: string]: string } = {
      "arbitrum-one": "https://arbiscan.io/tx/",
      "arbitrum-sepolia": "https://sepolia.arbiscan.io/tx/",
    };

    return `${baseUrls[network] || "https://arbiscan.io/tx/"}${txHash}`;
  };

  // Copy to clipboard with toast notification
  const copyToClipboardWithToast = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: `${type} copied to clipboard!`, type: "success" });
    } catch (err) {
      setToast({ message: `Failed to copy ${type}`, type: "error" });
    }
  };

  // Calculate expiry date from bidPlacedAt + 388 days (364 + 24)
  const calculateExpiryDate = (bidPlacedAt: string): Date => {
    const bidDate = new Date(bidPlacedAt);
    const expiryDate = new Date(bidDate);
    expiryDate.setDate(bidDate.getDate() + 388); // 364 + 24 days
    return expiryDate;
  };

  // Get expiry date for a contract (either evictionThresholdDate or calculated from bidPlacedAt)
  const getContractExpiryDate = (contract: Contract): Date | null => {
    if (contract.evictionThresholdDate) {
      return new Date(contract.evictionThresholdDate);
    } else if (contract.bidPlacedAt) {
      return calculateExpiryDate(contract.bidPlacedAt);
    }
    return null;
  };

  // Format date in IST timezone (date only, no time)
  const formatDateIST = (date: Date | string | null): string => {
    if (!date) return "-";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return "-";
    
    // Format in IST timezone - date only
    return dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Get status badge for expiry (Active/Expired)
  const getExpiryStatusBadge = (contract: Contract) => {
    const expiryDate = getContractExpiryDate(contract);
    if (!expiryDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Unknown
        </span>
      );
    }

    const now = new Date();
    const isActive = expiryDate > now;

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

  const getNetworkColor = (network: string): string => {
    const colors: { [key: string]: string } = {
      "arbitrum-sepolia": "bg-purple-500/20 text-purple-300",
      "arbitrum-one": "bg-red-500/20 text-red-300",
    };
    return colors[network] || "bg-zinc-500/20 text-gray-300";
  };

  const getDeployedViaDisplayName = (contract: Contract): string => {
    if (contract.usingUI) return "Web UI";
    if (contract.byCLI) return "CLI Tool";
    if (contract.usingAutoCacheFlag) return "Rust Crate";
    return "Unknown";
  };

  const getDeployedViaColor = (contract: Contract): string => {
    if (contract.usingUI)
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    if (contract.byCLI)
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (contract.usingAutoCacheFlag)
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-zinc-500/20 text-gray-300 border-gray-500/30";
  };

  const getDeployedViaIcon = (contract: Contract) => {
    if (contract.usingUI) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (contract.byCLI) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (contract.usingAutoCacheFlag) {
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getRankIcon = (index: number) => {
    const actualRank = (pagination.page - 1) * pagination.limit + index + 1;
    if (actualRank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (actualRank === 2) return <Trophy className="w-5 h-5 text-gray-300" />;
    if (actualRank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return (
      <span className="text-gray-400 font-mono text-sm">#{actualRank}</span>
    );
  };

  // No Data Component with SVG illustration
  const NoDataFound = ({ network }: { network: string }) => (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="mb-8">
        <svg
          width="200"
          height="160"
          viewBox="0 0 200 160"
          className="mx-auto opacity-60"
        >
          {/* Database icon */}
          <ellipse
            cx="100"
            cy="40"
            rx="60"
            ry="15"
            fill="#374151"
            stroke="#6B7280"
            strokeWidth="2"
          />
          <rect
            x="40"
            y="40"
            width="120"
            height="60"
            rx="5"
            fill="#374151"
            stroke="#6B7280"
            strokeWidth="2"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="60"
            ry="15"
            fill="#374151"
            stroke="#6B7280"
            strokeWidth="2"
          />

          {/* Search/magnifying glass */}
          <circle
            cx="140"
            cy="120"
            r="12"
            fill="none"
            stroke="#6B7280"
            strokeWidth="3"
          />
          <line
            x1="149"
            y1="129"
            x2="160"
            y2="140"
            stroke="#6B7280"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* X mark inside search */}
          <line
            x1="134"
            y1="114"
            x2="146"
            y2="126"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="146"
            y1="114"
            x2="134"
            y2="126"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Network indicators */}
          <circle cx="70" cy="60" r="3" fill="#6B7280" />
          <circle cx="100" cy="65" r="3" fill="#6B7280" />
          <circle cx="130" cy="60" r="3" fill="#6B7280" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-gray-300 mb-3">
        No Contracts Found
      </h3>

      <p className="text-gray-400 mb-6 max-w-md p-2">
        {network === "all"
          ? "No contracts are currently available in the leaderboard."
          : `No contracts found on ${getNetworkDisplayName(
              network
            )} network. Try switching to a different network or view all networks.`}
      </p>

      {network !== "all" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setSelectedNetwork("all")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            View All Networks
          </button>
        </div>
      )}
    </div>
  );

  // Show loading skeleton on initial load
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400 text-lg">Loading dashboard data...</p>
          </div>
          <LoadingSkeleton rows={10} showStats={true} />
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
          <p className="text-gray-400 text-lg">
            Top performing contracts ranked by gas optimization
          </p>
          {pagination.totalPages > 1 && (
            <p className="text-gray-400 text-sm mt-2">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={handleRefresh}
            onReset={() => {
              setError(null);
              resetPagination();
               fetchLeaderboardData("all", "gasSaved", 1, "desc");
            }}
            showDetails={true}
            className="mb-6"
          />
        )}

        {/* Enhanced Stats Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Gas Saved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.totalGasSaved?.toLocaleString() || "0"}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Contracts</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {getEnhancedStats().total.contracts.toLocaleString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {networkStatsLoaded ? (
                      <>
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                          Mainnet: {getEnhancedStats().mainnet.total.toLocaleString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                          Testnet: {getEnhancedStats().testnet.total.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-zinc-700/50 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-zinc-700/50 rounded animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                   <p className="text-gray-400 text-sm">Active Contracts</p>
                  <p className="text-2xl font-bold text-purple-400">
                     {getActiveContractsCount().toLocaleString()}
                   </p>
                   <p className="text-xs text-gray-500 mt-1">
                     {((getActiveContractsCount() / stats.totalContracts) * 100).toFixed(1)}% of total
                  </p>
                </div>
                 <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Onboarded Deployers</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats.uniqueDeployers || 0}
                  </p>
                </div>
                <Database className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>
        )}

        {/* ✅ FIXED: Leaderboard Table with ref for scroll preservation */}
        <div 
          ref={tableContainerRef}
          className="bg-zinc-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden relative"
        >
                     {pageLoading && data.length > 0 && !sortingField && (
            <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center z-10">
               <div className="flex items-center gap-2 text-blue-400">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 <span className="text-sm">Loading page...</span>
               </div>
            </div>
          )}

          {sortedData.length === 0 && !pageLoading ? (
            <NoDataFound network={selectedNetwork} />
          ) : sortedData.length === 0 && pageLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400">Loading contracts...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/50 border-b border-gray-700">
                                         <th 
                       className="group text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:bg-zinc-700/30 transition-colors duration-200 whitespace-nowrap"
                       onClick={() => handleSort("rank")}
                     >
                       <div className="flex items-center gap-2 whitespace-nowrap">
                         <span>Rank</span>
                         {getSortIcon("rank")}
                       </div>
                    </th>
                     <th className="text-left py-4 px-6 text-gray-300 font-semibold whitespace-nowrap">
                       <span>Contract</span>
                    </th>
                     <th className="text-left py-4 px-6 text-gray-300 font-semibold whitespace-nowrap">
                       <span>Deployer</span>
                    </th>
                     <th 
                       className="group text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:bg-zinc-700/30 transition-colors duration-200 whitespace-nowrap"
                       onClick={() => handleSort("deployedVia")}
                     >
                       <div className="flex items-center gap-2 whitespace-nowrap">
                         <span>Deployed Via</span>
                         {getSortIcon("deployedVia")}
                       </div>
                    </th>
                     <th 
                       className="group text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:bg-zinc-700/30 transition-colors duration-200 whitespace-nowrap"
                       onClick={() => handleSort("network")}
                     >
                       <div className="flex items-center gap-2 whitespace-nowrap">
                         <span>Network</span>
                         {getSortIcon("network")}
                       </div>
                    </th>
                     <th 
                       className="group text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:bg-zinc-700/30 transition-colors duration-200 whitespace-nowrap"
                       onClick={() => handleSort("gasSaved")}
                     >
                       <div className="flex items-center gap-2 whitespace-nowrap">
                         <span>Gas Saved</span>
                         {getSortIcon("gasSaved")}
                       </div>
                    </th>
                     <th 
                       className="group text-left py-4 px-6 text-gray-300 font-semibold cursor-pointer hover:bg-zinc-700/30 transition-colors duration-200 whitespace-nowrap"
                       onClick={() => handleSort("minBidRequired")}
                     >
                       <div className="flex items-center gap-2 whitespace-nowrap">
                         <span>Bid Amount</span>
                         {getSortIcon("minBidRequired")}
                       </div>
                     </th>
                     <th className="text-left py-4 px-6 text-gray-300 font-semibold whitespace-nowrap">
                       <span>Expiry</span>
                     </th>
                     <th className="text-left py-4 px-6 text-gray-300 font-semibold whitespace-nowrap">
                       Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((contract, index) => (
                    <tr
                      key={contract.contractAddress || contract._id}
                      className="border-b border-gray-700/50 hover:bg-zinc-700/20 transition-colors duration-200"
                    >
                                             <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankIcon(index)}
                        </div>
                      </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-mono text-sm flex items-center gap-2">
                          <span className="text-white">
                            {formatAddress(contract.contractAddress)}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                contract.contractAddress,
                                "contract",
                                contract.contractAddress
                              )
                            }
                            className="p-1 rounded hover:bg-zinc-700/50 transition-colors duration-200 group relative"
                            title="Copy contract address"
                          >
                            {copiedAddress ===
                            `contract-${contract.contractAddress}` ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                            )}
                          </button>
                          {copiedAddress ===
                            `contract-${contract.contractAddress}` && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap animate-fade-in">
                              Copied!
                            </span>
                          )}
                        </div>
                      </td>

                                             <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-mono text-sm flex items-center gap-2">
                          <span className="text-white">
                            {formatAddress(contract.deployedBy)}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                contract.deployedBy,
                                "deployer",
                                `${contract.contractAddress}-${contract.deployedBy}`
                              )
                            }
                            className="p-1 rounded hover:bg-zinc-700/50 transition-colors duration-200 group relative"
                            title="Copy deployer address"
                          >
                            {copiedAddress ===
                            `deployer-${contract.contractAddress}-${contract.deployedBy}` ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                            )}
                          </button>
                          {copiedAddress ===
                            `deployer-${contract.contractAddress}-${contract.deployedBy}` && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap animate-fade-in">
                              Copied!
                            </span>
                          )}
                        </div>
                      </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border ${getDeployedViaColor(
                              contract
                             )} transition-all duration-200 hover:scale-105 whitespace-nowrap`}
                          >
                            {getDeployedViaIcon(contract)}
                            {getDeployedViaDisplayName(contract)}
                          </span>
                        </div>
                      </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-2 rounded-xl text-xs font-medium ${getNetworkColor(
                            contract.network
                           )} whitespace-nowrap`}
                        >
                          {getNetworkDisplayName(contract.network)}
                        </span>
                      </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            {parseInt(
                              String(contract.gasSaved)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">
                            {contract.minBidRequired} ETH
                          </span>
                         </div>
                       </td>

                       <td className="py-4 px-6 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                           <span className="text-sm text-gray-300">
                             {formatDateIST(getContractExpiryDate(contract))}
                           </span>
                           {getExpiryStatusBadge(contract)}
                         </div>
                       </td>

                       <td className="py-4 px-6 whitespace-nowrap">
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
                              copyToClipboardWithToast(
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

          {/* ✅ FIXED: Enhanced Pagination Component with stable layout */}
          {pagination.totalPages > 1 && (
            <div 
              className="mt-8 px-6 py-8 bg-gradient-to-r from-zinc-800/30 via-zinc-800/20 to-zinc-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
              style={{
                minHeight: '120px', // Ensure consistent height
                opacity: 1,
                visibility: 'visible',
                position: 'relative'
              }}
            >
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={goToPage}
                loading={pageLoading}
                disabled={pageLoading}
                showFirstLast={true}
                showPageNumbers={true}
                maxVisiblePages={7}
                className="pagination-enter"
              />
            </div>
          )}
        </div>
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
  );
};

export default LeaderboardDashboard;
