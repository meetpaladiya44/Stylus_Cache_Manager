import React from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";

interface ContractEntriesChartProps {
  chartData: any[];
  hoveredChart: string | null;
  setHoveredChart: (chart: string | null) => void;
}

const ContractEntriesChart = ({ chartData, hoveredChart, setHoveredChart }: ContractEntriesChartProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
    style={{ backgroundColor: hoveredChart === "contractEntries" ? "rgba(251, 246, 255, 0.5)" : "white" }}
    onMouseEnter={() => setHoveredChart("contractEntries")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <h2 className="text-xl font-semibold mb-4">Contract Entries Analysis</h2>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="codeHash" interval={5} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 5 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name) => {
            if (name === "bid" && typeof value === "number") return value.toFixed(4);
            if (name === "size" && typeof value === "number") return `${value.toLocaleString()} bytes`;
            return value;
          }} labelFormatter={(label) => `Code Hash: ${label}`} />
          <Legend />
          <Line type="monotone" dataKey="size" stroke="#82ca9d" name="Size (bytes)" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="bid" stroke="#8884d8" name="Bid Value" dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default ContractEntriesChart; 