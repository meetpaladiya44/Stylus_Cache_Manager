import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";

interface FetchSmallestEntriesProps {
  smallestEntriesCount: string;
  setSmallestEntriesCount: (v: string) => void;
  fetchSmallestEntries: (k: string) => void;
  fetchingSmallestEntries: boolean;
  smallestEntries: any[];
}

const FetchSmallestEntries: React.FC<FetchSmallestEntriesProps> = ({
  smallestEntriesCount,
  setSmallestEntriesCount,
  fetchSmallestEntries,
  fetchingSmallestEntries,
  smallestEntries,
}) => (
  <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300 border border-blue-500/20">
          <Activity className="w-6 h-6 text-blue-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-100">Fetch Smallest Entries</h2>
          <p className="text-sm text-zinc-400">Get entries with lowest bids</p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">Number of Entries</label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter number"
              value={smallestEntriesCount}
              onChange={(e) => setSmallestEntriesCount(e.target.value)}
              min="1"
              max="50"
              className="flex-1 px-4 py-3 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400"
            />
            <button
              onClick={() => fetchSmallestEntries(smallestEntriesCount)}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={fetchingSmallestEntries || !smallestEntriesCount}
            >
              <span className="flex items-center gap-2">
                {fetchingSmallestEntries ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Fetch
                  </>
                )}
              </span>
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            💡 This fetches the smallest cache entries by bid amount. If no results appear, the cache might be empty.
          </p>
        </div>
        {smallestEntries && (
          <AnimatePresence>
            {smallestEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-300">Results</h3>
                  <span className="text-xs text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded-lg border border-zinc-600/50">
                    {smallestEntries.length} entries
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
                  {smallestEntries.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-600/50 hover:shadow-sm hover:bg-zinc-700/50 transition-all duration-200 group"
                    >
                      <div className="font-mono text-xs text-zinc-100 break-all">
                        {entry}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  </div>
);

export default FetchSmallestEntries; 