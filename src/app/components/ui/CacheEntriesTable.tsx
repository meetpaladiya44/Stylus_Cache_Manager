import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Copy, ExternalLink, Hash, Database } from "lucide-react";
import { ethers } from "ethers";

interface CacheEntriesTableProps {
  filteredEntries: any[];
  paginatedEntries: any[];
  entriesPerPage: number;
  currentPage: number;
  pageCount: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  handleSort: (column: string) => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showEntriesDropdown: boolean;
  setShowEntriesDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

const CacheEntriesTable: React.FC<CacheEntriesTableProps> = ({
  filteredEntries,
  paginatedEntries,
  entriesPerPage,
  currentPage,
  pageCount,
  setCurrentPage,
  sortColumn,
  sortDirection,
  handleSort,
  searchTerm,
  setSearchTerm,
  showEntriesDropdown,
  setShowEntriesDropdown,
}) => {
  // Dropdown close on outside click
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEntriesDropdown(false);
      }
    }
    if (showEntriesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEntriesDropdown, setShowEntriesDropdown]);

  // Loading state
  if (!paginatedEntries) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
        <div className="h-64 bg-slate-100 rounded" />
      </div>
    );
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${type} copied to clipboard: ${text}`);
  };

  const formatBidValue = (bid: string) => {
    const ethValue = ethers.formatEther(BigInt(bid));
    const numValue = parseFloat(ethValue);
    if (numValue < 0.001) {
      return `${(numValue * 1000000).toFixed(2)} μETH`;
    } else if (numValue < 1) {
      return `${(numValue * 1000).toFixed(3)} mETH`;
    } else {
      return `${numValue.toFixed(4)} ETH`;
    }
  };

  const getBidStatus = (bid: string) => {
    const ethValue = parseFloat(ethers.formatEther(BigInt(bid)));
    if (ethValue < 0.001) return "low";
    if (ethValue < 0.01) return "medium";
    return "high";
  };

  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = pageCount > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', pageCount);
      } else if (currentPage >= pageCount - 3) {
        pages.push(1, '...', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', pageCount);
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span key={index} className="px-3 py-2 text-slate-500">
            ...
          </span>
        );
      }

      return (
        <button
          key={index}
          onClick={() => setCurrentPage(page as number)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === page
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-8 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              Current Contract Entries
            </h2>
            <p className="text-sm text-slate-600">Browse and filter active cache entries with detailed analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 text-sm font-medium">{filteredEntries.length} entries</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Hash className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">Page {currentPage} of {pageCount}</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by code hash, size, or bid value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white hover:border-slate-400 text-sm"
            />
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
              className="group flex items-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 min-w-[140px]"
            >
              <span>Show {entriesPerPage}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEntriesDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showEntriesDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                <div className="py-2">
                  {[5, 10, 20, 50].map((number) => (
                    <button
                      key={number}
                      onClick={() => {
                        setShowEntriesDropdown(false);
                        setCurrentPage(1);
                        // setEntriesPerPage is expected to be handled in parent
                      }}
                      className={`w-full px-4 py-2 text-sm text-left transition-colors duration-200 ${entriesPerPage === number
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      Show {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors">
                    <Hash className="w-4 h-4" />
                    Code Hash
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("size")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors group"
                  >
                    <Database className="w-4 h-4" />
                    Size (Bytes)
                    <div className="flex flex-col">
                      <ChevronUp className={`w-3 h-3 transition-colors ${sortColumn === "size" && sortDirection === "asc" ? 'text-blue-600' : 'text-slate-400'}`} />
                      <ChevronDown className={`w-3 h-3 -mt-1 transition-colors ${sortColumn === "size" && sortDirection === "desc" ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort("bid")}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900 transition-colors"
                  >
                    💰 Bid Value
                    <div className="flex flex-col">
                      <ChevronUp className={`w-3 h-3 transition-colors ${sortColumn === "bid" && sortDirection === "asc" ? 'text-blue-600' : 'text-slate-400'}`} />
                      <ChevronDown className={`w-3 h-3 -mt-1 transition-colors ${sortColumn === "bid" && sortDirection === "desc" ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              <AnimatePresence>
                {paginatedEntries.length > 0 ? (
                  paginatedEntries.map((entry, index) => {
                    const bidStatus = getBidStatus(entry.bid);
                    return (
                      <motion.tr
                        key={entry.codeHash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group hover:bg-slate-50/80 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-mono text-sm text-slate-900 px-3 py-2 rounded-lg transition-colors">
                                {entry.codeHash.slice(0, 20)}...
                              </div>
                              
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-900">
                              {Number(entry.size).toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${bidStatus === 'high'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : bidStatus === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}>
                              {entry.bid}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(entry.codeHash, 'Code Hash')}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Copy Code Hash"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Database className="w-12 h-12 text-slate-300" />
                        <div className="text-sm text-slate-500">No entries found</div>
                        <div className="text-xs text-slate-400">Try adjusting your search criteria</div>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold">{Math.min((currentPage - 1) * entriesPerPage + 1, filteredEntries.length)}</span> to{' '}
            <span className="font-semibold">{Math.min(currentPage * entriesPerPage, filteredEntries.length)}</span> of{' '}
            <span className="font-semibold">{filteredEntries.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {renderPageNumbers()}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(pageCount)}
              disabled={currentPage === pageCount}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheEntriesTable; 