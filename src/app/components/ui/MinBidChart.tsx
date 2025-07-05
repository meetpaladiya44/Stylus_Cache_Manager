import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, Line } from "recharts";

interface MinBidChartProps {
  chartDataMinBid: any[];
  hoveredChart: string | null;
  setHoveredChart: (chart: string | null) => void;
  overallMinBid: number;
}

const MinBidChart = ({ chartDataMinBid, hoveredChart, setHoveredChart, overallMinBid }: MinBidChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-105"
    style={{ backgroundColor: hoveredChart === "minBid" ? "rgba(39, 39, 42, 0.7)" : undefined }}
    onMouseEnter={() => setHoveredChart("minBid")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <h2 className="text-xl font-semibold mb-4 text-zinc-100">Minimum Bid Analysis Over Entries</h2>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartDataMinBid}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="codeHash" interval={1} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 5, fill: "#a1a1aa" }} />
          <YAxis label={{ value: "Bid Value", angle: -90, position: "insideLeft", style: { textAnchor: 'middle', fill: '#a1a1aa' } }} tick={{ fontSize: 12, fill: "#a1a1aa" }} />
          <Tooltip
            formatter={(value) => typeof value === "number" ? value.toFixed(6) : value}
            labelFormatter={(label) => `Code Hash: ${label}`}
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7'
            }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa' }} />
          <ReferenceLine y={overallMinBid} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Minimum Bid Threshold", position: "top", style: { fill: '#ef4444' } }} />
          <Line type="monotone" dataKey="currentBid" stroke="#fbbf24" name="Current Bid" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="minBid" stroke="#f97316" name="Minimum Bid" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="avgBid" stroke="#22c55e" name="Average Bid" dot={{ r: 4 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default MinBidChart; 