import React from "react";
import { Database, ArrowUpCircle, Box, Activity, Zap } from "lucide-react";
import { displayDecay } from "@/utils/CacheManagerUtils";

interface CacheAnalyticsCardsProps {
  cacheSize: string | null;
  queueSize: string | null;
  entriesCount: number;
  isPaused: boolean;
  decay: string | null;
  filteredEntries: any[];
  prevCacheSize?: string | null;
  prevQueueSize?: string | null;
}

function getGrowth(current: string | null, prev: string | null): number | null {
  if (!current || !prev) return null;
  const curr = parseFloat(current);
  const previous = parseFloat(prev);
  if (isNaN(curr) || isNaN(previous) || previous === 0) return null;
  return ((curr - previous) / previous) * 100;
}

const CacheAnalyticsCards: React.FC<CacheAnalyticsCardsProps> = ({
  cacheSize,
  queueSize,
  entriesCount,
  isPaused,
  decay,
  filteredEntries,
  prevCacheSize,
  prevQueueSize,
}) => {
  const cacheGrowth = getGrowth(cacheSize, prevCacheSize ?? null);
  const queueGrowth = getGrowth(queueSize, prevQueueSize ?? null);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Cache Size Card */}
      <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300 border border-blue-500/20">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20" title={cacheGrowth !== null ? `Growth: ${cacheGrowth.toFixed(2)}%` : 'No previous data'}>
              <ArrowUpCircle className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">
                {cacheGrowth !== null ? `${cacheGrowth > 0 ? '+' : ''}${cacheGrowth.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">Cache Size</p>
            <h3 className="text-2xl font-bold text-zinc-100">
              {cacheSize ? `${cacheSize} Bytes` : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Hit Rate</span>
              <span className="text-lg font-semibold text-zinc-100">67%</span>
            </div>
            <div className="mt-2 w-full bg-zinc-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: "67%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Size Card */}
      <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors duration-300 border border-cyan-500/20">
              <Box className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20" title={queueGrowth !== null ? `Growth: ${queueGrowth.toFixed(2)}%` : 'No previous data'}>
              <Activity className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300">
                {queueGrowth !== null ? `${queueGrowth > 0 ? '+' : ''}${queueGrowth.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">Queue Size</p>
            <h3 className="text-2xl font-bold text-zinc-100">
              {queueSize ? `${queueSize} Bytes` : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Contract Entries</span>
              <span className="text-lg font-semibold text-zinc-100">
                {entriesCount || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decay Rate Card */}
      <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors duration-300 border border-green-500/20">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${isPaused ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`} title={isPaused ? 'Paused' : 'Active'}>
              <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-red-400" : "bg-green-400"} animate-pulse`}></div>
              <span className={`text-xs font-medium ${isPaused ? "text-red-300" : "text-green-300"}`}>
                {isPaused ? "Paused" : "Active"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">Decay Rate</p>
            <h3 className="text-2xl font-bold text-zinc-100">
              {decay ? displayDecay(decay) : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">System Status</span>
              <span className={`text-lg font-semibold ${isPaused ? "text-red-400" : "text-green-400"}`}>
                {isPaused ? "Inactive" : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Occupancy Card */}
      <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors duration-300 border border-orange-500/20">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-300">Optimized</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">Cache Occupancy</p>
            <h3 className="text-2xl font-bold text-zinc-100">
              {((filteredEntries.length / 4000) * 100).toFixed(1)}%
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Utilization</span>
              <span className="text-sm font-medium text-zinc-100">
                {filteredEntries.length}/4000
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((filteredEntries.length / 4000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheAnalyticsCards; 