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
    className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
    style={{ backgroundColor: hoveredChart === "minBid" ? "rgba(255, 247, 240, 0.5)" : "white" }}
    onMouseEnter={() => setHoveredChart("minBid")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <h2 className="text-xl font-semibold mb-4">Minimum Bid Analysis Over Entries</h2>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartDataMinBid}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="codeHash" interval={1} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 5 }} />
          <YAxis label={{ value: "Bid Value", angle: -90, position: "insideLeft" }} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => typeof value === "number" ? value.toFixed(6) : value} labelFormatter={(label) => `Code Hash: ${label}`} />
          <Legend />
          <ReferenceLine y={overallMinBid} stroke="red" strokeDasharray="3 3" label={{ value: "Minimum Bid Threshold", position: "top" }} />
          <Line type="monotone" dataKey="currentBid" stroke="#ffc658" name="Current Bid" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="minBid" stroke="#ff7300" name="Minimum Bid" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="avgBid" stroke="#82ca9d" name="Average Bid" dot={{ r: 4 }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default MinBidChart; 