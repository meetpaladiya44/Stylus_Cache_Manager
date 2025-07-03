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
  <div className="group relative bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">Fetch Smallest Entries</h2>
          <p className="text-sm text-slate-600">Get entries with lowest bids</p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Entries</label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter number"
              value={smallestEntriesCount}
              onChange={(e) => setSmallestEntriesCount(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-slate-50/50 hover:bg-white"
            />
            <button
              onClick={() => fetchSmallestEntries(smallestEntriesCount)}
              className="group relative px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-slate-700 hover:to-slate-800 hover:shadow-lg hover:shadow-slate-500/25 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="text-sm font-semibold text-slate-700">Results</h3>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {smallestEntries.length} entries
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {smallestEntries.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-800 hover:shadow-sm transition-shadow duration-200"
                    >
                      {entry}
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