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
      <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full" title={cacheGrowth !== null ? `Growth: ${cacheGrowth.toFixed(2)}%` : 'No previous data'}>
              <ArrowUpCircle className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                {cacheGrowth !== null ? `${cacheGrowth > 0 ? '+' : ''}${cacheGrowth.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Cache Size</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {cacheSize ? `${cacheSize} Bytes` : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Hit Rate</span>
              <span className="text-lg font-semibold text-slate-900">67%</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: "67%" }}></div>
            </div>
          </div>
        </div>
      </div>
      {/* Queue Size Card */}
      <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-300">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full" title={queueGrowth !== null ? `Growth: ${queueGrowth.toFixed(2)}%` : 'No previous data'}>
              <Activity className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">
                {queueGrowth !== null ? `${queueGrowth > 0 ? '+' : ''}${queueGrowth.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Queue Size</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {queueSize ? `${queueSize} Bytes` : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Contract Entries</span>
              <span className="text-lg font-semibold text-slate-900">
                {entriesCount || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Decay Rate Card */}
      <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPaused ? "bg-red-100" : "bg-green-100"}`} title={isPaused ? 'Paused' : 'Active'}>
              <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-red-500" : "bg-green-500"} animate-pulse`}></div>
              <span className={`text-xs font-medium ${isPaused ? "text-red-700" : "text-green-700"}`}>
                {isPaused ? "Paused" : "Active"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Decay Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {decay ? displayDecay(decay) : "Loading..."}
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">System Status</span>
              <span className={`text-lg font-semibold ${isPaused ? "text-red-600" : "text-green-600"}`}>
                {isPaused ? "Inactive" : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Cache Occupancy Card */}
      <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors duration-300">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
              <Zap className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">Optimized</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">Cache Occupancy</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {((filteredEntries.length / 4000) * 100).toFixed(1)}%
            </h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Utilization</span>
              <span className="text-sm font-medium text-slate-900">
                {filteredEntries.length}/4000
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
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