"use client";
import "../css/Landing.css";

import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ArrowUpCircle, Database, Box, Activity, Zap } from 'lucide-react';

const CacheManagerDashboard = () => {
  // Sample data - replace with actual data from your contract
  const [cacheData, setCacheData] = useState({
    used: 75,
    available: 25
  });
  
  const [timeSeriesData, setTimeSeriesData] = useState([
    { timestamp: '00:00', cacheSize: 50, entries: 5, minBid: 0.1 },
    { timestamp: '04:00', cacheSize: 60, entries: 7, minBid: 0.15 },
    { timestamp: '08:00', cacheSize: 75, entries: 10, minBid: 0.2 },
    { timestamp: '12:00', cacheSize: 65, entries: 8, minBid: 0.18 },
    { timestamp: '16:00', cacheSize: 80, entries: 12, minBid: 0.25 },
    { timestamp: '20:00', cacheSize: 70, entries: 9, minBid: 0.22 }
  ]);

  const [entries, setEntries] = useState([
    { address: '0x1234...5678', timestamp: '2024-03-22 10:30', minBid: '0.15 ETH' },
    { address: '0x8765...4321', timestamp: '2024-03-22 11:45', minBid: '0.20 ETH' },
    { address: '0x9876...1234', timestamp: '2024-03-22 12:15', minBid: '0.18 ETH' }
  ]);

  const [hitRate, setHitRate] = useState(85.5);
  const [metrics, setMetrics] = useState({
    queueSize: 15,
    cacheSize: 100,
    contractCount: 25,
    decayRate: 0.05
  });
  const [bidForm, setBidForm] = useState({
    address: '',
    amount: '',
    isPaused: false,
    minBid: null
  });

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Cache Manager Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Cache Size</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.cacheSize}</h3>
            </div>
            <Database className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4">
            <p className="text-sm">Hit Rate</p>
            <div className="flex items-center mt-1">
              <span className="text-xl font-semibold">{hitRate}%</span>
              <ArrowUpCircle className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Queue Size</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.queueSize}</h3>
            </div>
            <Box className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4">
            <p className="text-sm">Active Contracts</p>
            <p className="text-xl font-semibold mt-1">{metrics.contractCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Decay Rate</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.decayRate}%</h3>
            </div>
            <Activity className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4">
            <p className="text-sm">Status</p>
            <p className="text-xl font-semibold mt-1">Active</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Performance</p>
              <h3 className="text-2xl font-bold mt-1">95%</h3>
            </div>
            <Zap className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4">
            <p className="text-sm">Optimization</p>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-white rounded-full h-2 w-[95%]"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Usage Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Cache Usage Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Used', value: cacheData.used },
                    { name: 'Available', value: cacheData.available }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cache Size Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Cache Size Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cacheSize" stroke="#8884d8" name="Cache Size" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Entries Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Contract Entries Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entries" stroke="#82ca9d" name="Number of Entries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Minimum Bid Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Minimum Bid Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="minBid" stroke="#ffc658" name="Minimum Bid (ETH)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contract Entries Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Current Contract Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Bid</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">{entry.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.minBid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bid Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Place Bid</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contract Address</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0x..."
                value={bidForm.address}
                onChange={(e) => setBidForm({...bidForm, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bid Amount (ETH)</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.0"
                value={bidForm.amount}
                onChange={(e) => setBidForm({...bidForm, amount: e.target.value})}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Place Bid
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Bid Information</h2>
          <div className="space-y-4">
            <div>
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors"
                onClick={() => {/* Add fetch logic */}}
              >
                Fetch Minimum Bid
              </button>
              {bidForm.minBid && (
                <p className="mt-2 text-sm text-gray-600">
                  Minimum Bid: {bidForm.minBid} ETH
                </p>
              )}
            </div>
            <div>
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors"
                onClick={() => {/* Add fetch logic */}}
              >
                Fetch Smallest Entries
              </button>
            </div>
            <div>
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors"
                onClick={() => {/* Add fetch logic */}}
              >
                Check if Paused
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Status: {bidForm.isPaused ? 'Paused' : 'Active'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManagerDashboard;