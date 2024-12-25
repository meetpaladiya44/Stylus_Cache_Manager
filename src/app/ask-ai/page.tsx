'use client'
import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Brain, AlertTriangle, Timer, TrendingUp, DollarSign, Settings, Shield, Activity } from 'lucide-react';

const AIAgentDashboard = () => {
  // Sample static data
  const [riskMetrics, setRiskMetrics] = useState({
    currentRisk: 0.35,
    optimalBid: 0.25,
    timeToEviction: '2h 15m',
    budgetUtilization: 65
  });

  const [historicalData] = useState([
    { timestamp: '12:00', risk: 0.2, bid: 0.15, threshold: 0.3 },
    { timestamp: '13:00', risk: 0.25, bid: 0.18, threshold: 0.3 },
    { timestamp: '14:00', risk: 0.35, bid: 0.25, threshold: 0.3 },
    { timestamp: '15:00', risk: 0.28, bid: 0.22, threshold: 0.3 },
    { timestamp: '16:00', risk: 0.32, bid: 0.24, threshold: 0.3 }
  ]);

  const [modelMetrics] = useState({
    accuracy: 92,
    precision: 89,
    recall: 94,
    f1Score: 91
  });

  const [recentPredictions] = useState([
    { timestamp: '15:45', prediction: 'Low Risk', confidence: 0.85, action: 'No Action' },
    { timestamp: '15:30', prediction: 'Medium Risk', confidence: 0.75, action: 'Increased Bid' },
    { timestamp: '15:15', prediction: 'High Risk', confidence: 0.92, action: 'Emergency Bid' }
  ]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">AI Agent Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Configure AI Agent
        </button>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Current Risk Level</p>
              <h3 className="text-2xl font-bold mt-1">{(riskMetrics.currentRisk * 100).toFixed(1)}%</h3>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2" 
              style={{ width: `${riskMetrics.currentRisk * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Optimal Bid</p>
              <h3 className="text-2xl font-bold mt-1">{riskMetrics.optimalBid} ETH</h3>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">Recommended bid to prevent eviction</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Time to Eviction</p>
              <h3 className="text-2xl font-bold mt-1">{riskMetrics.timeToEviction}</h3>
            </div>
            <Timer className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">Estimated time remaining</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Budget Utilization</p>
              <h3 className="text-2xl font-bold mt-1">{riskMetrics.budgetUtilization}%</h3>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2" 
              style={{ width: `${riskMetrics.budgetUtilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Risk Analysis Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="risk" stroke="#ef4444" name="Risk Score" />
                <Line type="monotone" dataKey="bid" stroke="#22c55e" name="Bid Amount" />
                <Line type="monotone" dataKey="threshold" stroke="#3b82f6" name="Threshold" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Model Performance Metrics</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Accuracy', value: modelMetrics.accuracy },
                { name: 'Precision', value: modelMetrics.precision },
                { name: 'Recall', value: modelMetrics.recall },
                { name: 'F1 Score', value: modelMetrics.f1Score }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1">
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Predictions & Actions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Taken</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPredictions.map((pred, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pred.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pred.prediction === 'Low Risk' ? 'bg-green-100 text-green-800' :
                      pred.prediction === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pred.prediction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(pred.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pred.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIAgentDashboard;