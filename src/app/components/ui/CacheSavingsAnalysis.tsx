import React from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface CacheSavingsAnalysisProps {
  loadingGasAnalysis: boolean;
  isIncrementalUpdate: boolean;
  fetchProgramAddresses: (forceRefresh?: boolean) => void;
  gasAnalysisData: {
    totalGasWithoutCache: number;
    totalGasWithCache: number;
    totalGasSaved: number;
  };
  cacheData: { name: string; value: number }[];
  programAddresses: string[];
  lastFetchedBlock: bigint | null;
}

const CacheSavingsAnalysis: React.FC<CacheSavingsAnalysisProps> = ({
  loadingGasAnalysis,
  isIncrementalUpdate,
  fetchProgramAddresses,
  gasAnalysisData,
  cacheData,
  programAddresses,
  lastFetchedBlock,
}) => {
  const [hoverColor, setHoverColor] = React.useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
      style={{ backgroundColor: hoverColor }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-100">
            Cache Savings Analysis
          </h2>
          <p className="text-sm text-zinc-400">
            Real-time gas efficiency metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          {loadingGasAnalysis && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm font-medium text-blue-300">Analyzing...</span>
            </div>
          )}
          {isIncrementalUpdate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-green-300">Live Update</span>
            </div>
          )}
          <button
            onClick={() => fetchProgramAddresses(true)}
            disabled={loadingGasAnalysis}
            className="group relative px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">Refresh Analysis</span>
          </button>
        </div>
      </div>
      <div className="h-64">
        {loadingGasAnalysis ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Fetching program addresses...
              </p>
              <p className="text-sm text-gray-400">
                Calculating gas savings from recent bids
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cacheData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                onMouseEnter={(data, index) => {
                  setHoverColor(
                    index === 0
                      ? "rgba(76, 175, 80, 0.1)"
                      : "rgba(33, 150, 243, 0.1)"
                  );
                }}
                onMouseLeave={() => setHoverColor("")}
              >
                {cacheData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#4CAF50" : "#2196F3"}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${Number(value).toLocaleString()} gas units`}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="group relative bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="px-2 bg-red-200 rounded-full">
                <span className="text-xs font-medium text-red-800">No Cache</span>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-slate-600">Without Cache</h4>
              <p className="text-2xl font-bold text-red-600">
                {gasAnalysisData.totalGasWithoutCache.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Gas Units</p>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border border-green-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="px-2 bg-green-200 rounded-full">
                <span className="text-xs font-medium text-green-800">Cached</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-600">With Cache</h3>
              <p className="text-2xl font-bold text-green-600">
                {gasAnalysisData.totalGasWithCache.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Gas Units</p>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="px-2 bg-blue-200 rounded-full">
                <span className="text-xs font-medium text-blue-800">Savings</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-600">Gas Saved</h3>
              <p className="text-2xl font-bold text-blue-600">
                {gasAnalysisData.totalGasSaved.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Gas Units</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Programs analyzed: <strong>{programAddresses.length}</strong>
          </span>
          {gasAnalysisData.totalGasSaved > 0 && (
            <span>
              Average savings per program: <strong>{Math.round(gasAnalysisData.totalGasSaved / programAddresses.length).toLocaleString()}</strong> gas units
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Data based on {lastFetchedBlock ? `blockchain data up to block ${lastFetchedBlock.toString()}` : "recent events from the cache manager contract"} •
          {isIncrementalUpdate ? " Live updating..." : " Auto-updates every minute"}
        </p>
      </div>
    </motion.div>
  );
};

export default CacheSavingsAnalysis; 