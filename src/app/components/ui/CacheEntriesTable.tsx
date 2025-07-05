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
      <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 animate-pulse">
        <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2" />
        <div className="h-64 bg-zinc-700 rounded" />
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
          <span key={index} className="px-3 py-2 text-zinc-500">
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
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-700/30 p-8 border-b border-zinc-600/50">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-400" />
              Current Contract Entries
            </h2>
            <p className="text-sm text-zinc-400">Browse and filter active cache entries with detailed analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-600/50 rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-zinc-300 text-sm font-medium">{filteredEntries.length} entries</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Hash className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Page {currentPage} of {pageCount}</span>
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
              className="w-full pl-12 pr-4 py-3 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 bg-zinc-700/50 hover:border-zinc-500/50 text-sm text-zinc-100 placeholder-zinc-400"
            />
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400"
              size={20}
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
              className="group flex items-center gap-2 px-4 py-3 bg-zinc-700/50 border border-zinc-600/50 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700/70 hover:border-zinc-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 min-w-[140px]"
            >
              <span>Show {entriesPerPage}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEntriesDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showEntriesDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-zinc-700/60 z-20 overflow-hidden">
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
                        ? 'bg-blue-500/20 text-blue-300 font-semibold border-l-2 border-blue-400'
                        : 'text-zinc-300 hover:bg-zinc-700/50'
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

      {/* Table Container with Curved Borders */}
      <div className="p-6">
        <div className="bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-zinc-700/40 shadow-inner overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              {/* Enhanced Table Header */}
              <thead className="bg-gradient-to-r from-zinc-800/60 to-zinc-700/60 border-b border-zinc-600/30">
                <tr>
                  <th
                    onClick={() => handleSort("codeHash")}
                    className="px-8 py-5 text-left text-xs font-bold text-zinc-200 uppercase tracking-wider cursor-pointer hover:bg-zinc-600/20 transition-all duration-200 select-none group first:rounded-tl-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Code Hash
                      {sortColumn === "codeHash" && (
                        <div className="flex items-center">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("size")}
                    className="px-8 py-5 text-left text-xs font-bold text-zinc-200 uppercase tracking-wider cursor-pointer hover:bg-zinc-600/20 transition-all duration-200 select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Size (bytes)
                      {sortColumn === "size" && (
                        <div className="flex items-center">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bid")}
                    className="px-8 py-5 text-left text-xs font-bold text-zinc-200 uppercase tracking-wider cursor-pointer hover:bg-zinc-600/20 transition-all duration-200 select-none group last:rounded-tr-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      Bid Value
                      {sortColumn === "bid" && (
                        <div className="flex items-center">
                          {sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              {/* Enhanced Table Body */}
              <tbody className="bg-zinc-800/20 divide-y divide-zinc-700/30">
                <AnimatePresence mode="popLayout">
                  {paginatedEntries.map((entry, index) => (
                    <motion.tr
                      key={`${entry.codeHash}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-cyan-500/5 group border-l-4 border-transparent hover:border-blue-500/30 ${
                        index === paginatedEntries.length - 1 ? 'last:border-b-0' : ''
                      }`}
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <code className="relative text-sm bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 rounded-lg font-mono text-zinc-200 group-hover:border-blue-500/40 transition-all duration-300 shadow-sm">
                              {`${entry.codeHash.slice(0, 8)}...${entry.codeHash.slice(-6)}`}
                            </code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(entry.codeHash, "Code hash")}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg transition-all duration-200 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 opacity-0 group-hover:opacity-100"
                            title="Copy code hash"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-400/20 border border-green-400/40 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          </div>
                          <span className="text-zinc-300 font-semibold text-sm">
                            {parseInt(entry.size).toLocaleString()}
                          </span>
                          <span className="text-zinc-500 text-xs">bytes</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 shadow-sm transition-all duration-200 ${
                              getBidStatus(entry.bid) === "low"
                                ? "bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20"
                                : getBidStatus(entry.bid) === "medium"
                                ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20"
                                : "bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/20"
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              getBidStatus(entry.bid) === "low" ? "bg-red-400" :
                              getBidStatus(entry.bid) === "medium" ? "bg-yellow-400" : "bg-green-400"
                            }`}></div>
                            {entry.bid}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="bg-zinc-700/20 px-8 py-6 border-t border-zinc-600/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Showing{" "}
              <span className="font-medium text-zinc-300">
                {(currentPage - 1) * entriesPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-zinc-300">
                {Math.min(currentPage * entriesPerPage, filteredEntries.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-zinc-300">
                {filteredEntries.length}
              </span>{" "}
              results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {renderPageNumbers()}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheEntriesTable;