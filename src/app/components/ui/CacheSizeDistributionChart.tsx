import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area } from "recharts";

interface CacheSizeDistributionChartProps {
  chartDataCacheSize: any[];
  hoveredChart: string | null;
  setHoveredChart: (chart: string | null) => void;
  averageSize: number;
}

const CacheSizeDistributionChart = ({ chartDataCacheSize, hoveredChart, setHoveredChart, averageSize }: CacheSizeDistributionChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="group relative bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
    style={{ backgroundColor: hoveredChart === "cacheSize" ? "rgba(248, 251, 255, 0.5)" : "white" }}
    onMouseEnter={() => setHoveredChart("cacheSize")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Cache Size Distribution</h2>
        <p className="text-sm text-slate-600">Entry size analysis and trends</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        <span className="text-purple-700 text-sm font-medium">Real-time</span>
      </div>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartDataCacheSize}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="codeHash" interval={5} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 5 }} />
          <YAxis label={{ value: "Size (bytes)", angle: -90, position: "insideLeft", fontSize: 12 }} tick={{ fontSize: 8 }} />
          <Tooltip formatter={(value) => `${value.toLocaleString()} bytes`} labelFormatter={(label) => `Code Hash: ${label}`} />
          <Legend />
          <Line type="monotone" dataKey="currentSize" stroke="#8884d8" name="Entry Size" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="averageSize" stroke="#82ca9d" name="Running Average" strokeDasharray="5 5" />
          <Area type="monotone" dataKey="cumulativeSize" fill="#8884d8" stroke="#8884d8" fillOpacity={0.1} name="Cumulative Size" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 text-sm text-gray-600 flex justify-between">
      <span>
        Total Cache Size: {chartDataCacheSize[chartDataCacheSize.length - 1]?.cumulativeSize.toLocaleString()} bytes
      </span>
      <span>
        Average Entry Size: {averageSize.toLocaleString()} bytes
      </span>
    </div>
  </motion.div>
);

export default CacheSizeDistributionChart; 