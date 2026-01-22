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
    className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
    style={{ backgroundColor: hoveredChart === "cacheSize" ? "rgba(39, 39, 42, 0.7)" : undefined }}
    onMouseEnter={() => setHoveredChart("cacheSize")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-zinc-100">Cache Size Distribution</h2>
        <p className="text-sm text-zinc-400">Entry size analysis and trends</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <span className="text-cyan-300 text-sm font-medium">Real-time</span>
      </div>
    </div>
    <div className="h-[55vh]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartDataCacheSize}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="codeHash" interval={5} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 5, fill: "#a1a1aa" }} />
          <YAxis label={{ value: "Size (bytes)", angle: -90, position: "insideLeft", fontSize: 12, style: { textAnchor: 'middle', fill: '#a1a1aa' } }} tick={{ fontSize: 8, fill: "#a1a1aa" }} />
          <Tooltip
            formatter={(value) => `${value.toLocaleString()} bytes`}
            labelFormatter={(label) => `Code Hash: ${label}`}
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7'
            }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa' }} />
          <Line type="monotone" dataKey="currentSize" stroke="#3b82f6" name="Entry Size" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="averageSize" stroke="#22c55e" name="Running Average" strokeDasharray="5 5" />
          <Area type="monotone" dataKey="cumulativeSize" fill="#06b6d4" stroke="#06b6d4" fillOpacity={0.1} name="Cumulative Size" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-4 text-sm text-zinc-400 flex justify-between">
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