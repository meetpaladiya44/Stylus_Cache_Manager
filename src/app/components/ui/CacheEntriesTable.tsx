import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
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

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">Current Contract Entries</h2>
          <p className="text-sm text-slate-600">Browse and filter active cache entries</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-slate-700 text-sm font-medium">{filteredEntries.length} entries</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by code hash, size, or bid value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-slate-50/50 hover:bg-white"
          />
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={20}
          />
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
            className="group flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <span>Show {entriesPerPage}</span>
            <ChevronDown className={`w-4 h-4 transition-transform group-hover:rotate-180 ${showEntriesDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showEntriesDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden animate-fade-in">
              <div className="py-2">
                {[5, 10, 20, 50].map((number) => (
                  <button
                    key={number}
                    onClick={() => {
                      setShowEntriesDropdown(false);
                      setCurrentPage(1);
                      // setEntriesPerPage is expected to be handled in parent
                    }}
                    className={`w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors duration-200 ${entriesPerPage === number ? 'bg-blue-50 font-semibold text-blue-700' : ''}`}
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
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button className="font-semibold text-xs uppercase tracking-wider flex items-center">
                  Code Hash
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort("size")} className="font-semibold text-xs uppercase tracking-wider flex items-center">
                  Size (Bytes)
                  {sortColumn === "size" && (sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort("bid")} className="font-semibold text-xs uppercase tracking-wider flex items-center">
                  Bid Value
                  {sortColumn === "bid" && (sortDirection === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry, index) => (
                  <motion.tr
                    key={entry.codeHash}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50/60`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span title={entry.codeHash}>{entry.codeHash.slice(0, 20)}...</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span title={Number(entry.size).toLocaleString()}>{Number(entry.size).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span title={entry.bid}>{ethers.formatEther(BigInt(entry.bid))}</span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
          Showing {Math.min(filteredEntries.length, entriesPerPage)} of {filteredEntries.length} entries
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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
            disabled={currentPage === pageCount}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheEntriesTable; 