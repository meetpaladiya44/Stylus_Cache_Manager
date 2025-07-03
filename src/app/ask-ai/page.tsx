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
  // const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const provider = new BrowserProvider(window.ethereum);

  const fetchDashboardData = async () => {
    try {
      // Get the current wallet address
      console.log("before signer");
      const signer = await provider.getSigner();
      console.log("after signer");
      const walletAddress = await signer.getAddress();
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
  }, []);

  const handleDataUpdate = (newData: DashboardData) => {
    if (dashboardData) {
      setDashboardData((prev) => (prev ? { ...prev, ...newData } : null));
    }
  };

  if (!dashboardData) return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <span className="text-slate-700 font-semibold text-lg">Loading AI Dashboard...</span>
        <p className="text-slate-500 text-sm">Analyzing your cache data and predictions</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                AI Agent Dashboard
              </h1>
              <p className="text-slate-600">Monitor your AI agent's performance and cache optimization insights</p>
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
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors duration-300">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-red-700">Risk</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Current Risk Level</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {(riskMetrics.currentRisk * 100).toFixed(1)}%
                </h3>
                <p className="text-xs text-slate-500">Probability of eviction</p>
              </div>
              <div className="mt-4 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${riskMetrics.currentRisk * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Optimal</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Optimal Bid</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {riskMetrics.optimalBid.toFixed(3)} ETH
                </h3>
                <p className="text-xs text-slate-500">Recommended bid amount</p>
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
                  <Timer className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                  <Activity className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Countdown</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Time to Eviction</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {riskMetrics.timeToEviction}
                </h3>
                <p className="text-xs text-slate-500">Estimated time remaining</p>
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-300">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                  <PieChartIcon className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Usage</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Budget Utilization</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {riskMetrics.budgetUtilization.toFixed(1)}%
                </h3>
                <p className="text-xs text-slate-500">Current budget usage</p>
              </div>
              <div className="mt-4 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${riskMetrics.budgetUtilization}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors duration-300">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                  <Settings className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">AI</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">AI Confidence</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {aiMetrics.predictionAccuracy.toFixed(1)}%
                </h3>
                <p className="text-xs text-slate-500">Last optimized {aiMetrics.lastOptimization}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Risk Analysis Over Time
              </h2>
              <p className="text-sm text-slate-600 mt-1">Monitor risk trends and bid performance</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timestamp" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(3)}`}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Decay Rate Analysis
              </h2>
              <p className="text-sm text-slate-600 mt-1">Predicted vs actual decay rates</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-600" />
              Contract Parameters
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Minimum Bid</span>
                <span className="font-bold text-slate-900">
                  {contractParams.minBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Current Bid</span>
                <span className="font-bold text-slate-900">
                  {contractParams.currentBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">Eviction Threshold</span>
                <span className="font-bold text-slate-900">
                  {contractParams.evictionThreshold} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">User Stake</span>
                <span className="font-bold text-slate-900">
                  {contractParams.userStake} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600" />
              Risk Metrics
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Bid Difference</span>
                  <span className="font-bold text-slate-900">
                    {aiMetrics.bidDifference.toFixed(3)} ETH
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-3/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Time Pressure</span>
                  <span className="font-bold text-slate-900">
                    {(aiMetrics.timePressure * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Stake to Bid Ratio</span>
                  <span className="font-bold text-slate-900">
                    {aiMetrics.stakeToBidRatio.toFixed(2)}x
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-4/5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              Eviction Risk Factors
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={evictionRiskFactors}
                  margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                >
                  <PolarGrid gridType="polygon" stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="factor"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-600" />
              Recent AI Actions
            </h2>
            <p className="text-sm text-slate-600 mt-1">Latest predictions and automated actions taken by your AI agent</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Prediction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {recentPredictions.map((pred, index) => (
                  <tr key={index} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/60`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {pred.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-semibold border ${pred.prediction === "Low Risk"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : pred.prediction === "Medium Risk"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                          }`}
                      >
                        {pred.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {(pred.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
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
