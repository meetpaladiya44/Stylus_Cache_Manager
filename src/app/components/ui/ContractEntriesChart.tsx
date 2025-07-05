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
    className="bg-zinc-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-105"
    style={{ backgroundColor: hoveredChart === "contractEntries" ? "rgba(39, 39, 42, 0.7)" : undefined }}
    onMouseEnter={() => setHoveredChart("contractEntries")}
    onMouseLeave={() => setHoveredChart(null)}
  >
    <h2 className="text-xl font-semibold mb-4 text-zinc-100">Contract Entries Analysis</h2>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="codeHash" interval={5} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 5, fill: "#a1a1aa" }} />
          <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} />
          <Tooltip
            formatter={(value, name) => {
              if (name === "bid" && typeof value === "number") return value.toFixed(4);
              if (name === "size" && typeof value === "number") return `${value.toLocaleString()} bytes`;
              return value;
            }}
            labelFormatter={(label) => `Code Hash: ${label}`}
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7'
            }}
          />
          <Legend wrapperStyle={{ color: '#a1a1aa' }} />
          <Line type="monotone" dataKey="size" stroke="#22c55e" name="Size (bytes)" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="bid" stroke="#3b82f6" name="Bid Value" dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default ContractEntriesChart; 