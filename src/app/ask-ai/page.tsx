"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Brain,
  AlertTriangle,
  Timer,
  TrendingUp,
  DollarSign,
  Settings,
  Shield,
  Activity,
  Database,
  Lock,
  PieChart as PieChartIcon,
} from "lucide-react";
import ConfigureAIModal from "../components/ConfigureAIModal ";

import { DashboardData } from "../../../types";
import { BrowserProvider } from "ethers";
import { useAccount } from "wagmi";

type FullDashboardData = DashboardData & {
  recentPredictions: Array<{
    timestamp: string;
    prediction: string;
    confidence: number;
    action: string;
  }>;
  decayData: Array<{
    time: string;
    decayRate: number;
    predictedDecay: number;
  }>;
  contractParams: {
    minBid: number;
    timeLeft: string;
    currentBid: number;
    evictionThreshold: number;
    userStake: number;
  };
  evictionRiskFactors: Array<{
    factor: string;
    score: number;
  }>;
};

const AIAgentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Move the useAccount hook to the top level of the component
  const { address: walletAddress } = useAccount();
  // const [provider, setProvider] = useState<BrowserProvider | null>(null);
  // const provider = new BrowserProvider(window?.ethereum);

  const fetchDashboardData = async () => {
    try {
      // Get the current wallet address
      // console.log("before signer");
      // const signer = await provider.getSigner();
      // console.log("after signer");
      // const walletAddress = await signer.getAddress();
      
      // Use the walletAddress from the hook
      console.log("address", walletAddress);

      const response = await fetch("/api/dashboard", {
        headers: {
          "Content-Type": "application/json",
          ...(walletAddress && { "x-wallet-address": walletAddress }),
        },
      });

      console.log("response", response);

      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data: FullDashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [walletAddress]); // Add walletAddress as a dependency so it refetches when the address changes

  const handleDataUpdate = (newData: DashboardData) => {
    if (dashboardData) {
      setDashboardData((prev) => (prev ? { ...prev, ...newData } : null));
    }
  };

  if (!dashboardData) return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <span className="text-zinc-100 font-semibold text-lg">Loading AI Dashboard...</span>
        <p className="text-zinc-400 text-sm">Analyzing your cache data and predictions</p>
      </div>
    </div>
  );

  const {
    recentPredictions,
    decayData,
    contractParams,
    evictionRiskFactors,
    riskMetrics,
    historicalData,
    modelMetrics,
    aiMetrics,
  } = dashboardData;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header Section */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/60">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-400" />
                AI Agent Dashboard
              </h1>
              <p className="text-zinc-400">Monitor your AI agent's performance and cache optimization insights</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <Brain className="w-5 h-5" />
              Configure AI Agent
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-8 space-y-8">
        {/* Risk Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors duration-300 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-red-300">Risk</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">Current Risk Level</p>
                <h3 className="text-2xl font-bold text-zinc-100">
                  {(riskMetrics.currentRisk * 100).toFixed(1)}%
                </h3>
                <p className="text-xs text-zinc-500">Probability of eviction</p>
              </div>
              <div className="mt-4 bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${riskMetrics.currentRisk * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors duration-300 border border-green-500/20">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-medium text-green-300">Optimal</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">Optimal Bid</p>
                <h3 className="text-2xl font-bold text-zinc-100">
                  {riskMetrics.optimalBid.toFixed(3)} ETH
                </h3>
                <p className="text-xs text-zinc-500">Recommended bid amount</p>
              </div>
            </div>
          </div>

          <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300 border border-blue-500/20">
                  <Timer className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <Activity className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-medium text-blue-300">Countdown</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">Time to Eviction</p>
                <h3 className="text-2xl font-bold text-zinc-100">
                  {riskMetrics.timeToEviction}
                </h3>
                <p className="text-xs text-zinc-500">Estimated time remaining</p>
              </div>
            </div>
          </div>

          <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors duration-300 border border-orange-500/20">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                  <PieChartIcon className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-medium text-orange-300">Usage</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">Budget Utilization</p>
                <h3 className="text-2xl font-bold text-zinc-100">
                  {riskMetrics.budgetUtilization.toFixed(1)}%
                </h3>
                <p className="text-xs text-zinc-500">Current budget usage</p>
              </div>
              <div className="mt-4 bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${riskMetrics.budgetUtilization}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors duration-300 border border-cyan-500/20">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                  <Settings className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">AI</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">AI Confidence</p>
                <h3 className="text-2xl font-bold text-zinc-100">
                  {aiMetrics.predictionAccuracy.toFixed(1)}%
                </h3>
                <p className="text-xs text-zinc-500">Last optimized {aiMetrics.lastOptimization}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Risk Analysis Over Time
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Monitor risk trends and bid performance</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="timestamp" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(3)}`}
                    contentStyle={{
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                      color: '#e4e4e7'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Risk Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="bid"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Bid Amount"
                  />
                  <Line
                    type="monotone"
                    dataKey="threshold"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Threshold"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Decay Rate Analysis
              </h2>
              <p className="text-sm text-zinc-400 mt-1">Predicted vs actual decay rates</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="time" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                      color: '#e4e4e7'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="decayRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Actual Decay"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedDecay"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Predicted Decay"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Contract Parameters and Risk Metrics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-zinc-400" />
              Contract Parameters
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
                <span className="text-zinc-400 font-medium">Minimum Bid</span>
                <span className="font-bold text-zinc-100">
                  {contractParams.minBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
                <span className="text-zinc-400 font-medium">Current Bid</span>
                <span className="font-bold text-zinc-100">
                  {contractParams.currentBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
                <span className="text-zinc-400 font-medium">Eviction Threshold</span>
                <span className="font-bold text-zinc-100">
                  {contractParams.evictionThreshold} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
                <span className="text-zinc-400 font-medium">User Stake</span>
                <span className="font-bold text-zinc-100">
                  {contractParams.userStake} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              Risk Metrics
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Bid Difference</span>
                  <span className="font-bold text-zinc-100">
                    {aiMetrics.bidDifference.toFixed(3)} ETH
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-3/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Time Pressure</span>
                  <span className="font-bold text-zinc-100">
                    {(aiMetrics.timePressure * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Stake to Bid Ratio</span>
                  <span className="font-bold text-zinc-100">
                    {aiMetrics.stakeToBidRatio.toFixed(2)}x
                  </span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-4/5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" />
              Eviction Risk Factors
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={evictionRiskFactors}
                  margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                >
                  <PolarGrid gridType="polygon" stroke="#3f3f46" />
                  <PolarAngleAxis
                    dataKey="factor"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="score"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                      color: '#e4e4e7'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-zinc-400" />
              Recent AI Actions
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Latest predictions and automated actions taken by your AI agent</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-zinc-700/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Prediction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-800/30 divide-y divide-zinc-700/50">
                {recentPredictions.map((pred, index) => (
                  <tr key={index} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-zinc-800/20' : 'bg-zinc-700/20'} hover:bg-blue-500/10`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-medium">
                      {pred.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-semibold border ${pred.prediction === "Low Risk"
                          ? "bg-green-500/10 text-green-300 border-green-500/30"
                          : pred.prediction === "Medium Risk"
                            ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                            : "bg-red-500/10 text-red-300 border-red-500/30"
                          }`}
                      >
                        {pred.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-medium">
                      {(pred.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {pred.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfigureAIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateData={handleDataUpdate}
      />
    </div>
  );
};

export default AIAgentDashboard;