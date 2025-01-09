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

      console.log("response");

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
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <div className="flex items-center space-x-2">
        <div className="h-5 w-5 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-600 font-medium">Loading...</span>
      </div>
    </div>
  );;

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
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8 px-6">
        <h1 className="text-3xl font-bold text-gray-800 ml-[8px]">
          AI Agent Dashboard
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Brain className="w-5 h-5" />
          Configure AI Agent
        </button>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Current Risk Level</p>
              <h3 className="text-2xl font-bold mt-1">
                {(riskMetrics.currentRisk * 100).toFixed(1)}%
              </h3>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">
            The current probability of eviction
          </p>
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
              <h3 className="text-2xl font-bold mt-1">
                {riskMetrics.optimalBid.toFixed(3)} ETH
              </h3>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">
            Recommended bid to prevent eviction
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Time to Eviction</p>
              <h3 className="text-2xl font-bold mt-1">
                {riskMetrics.timeToEviction}
              </h3>
            </div>
            <Timer className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">Estimated time remaining</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Budget Utilization</p>
              <h3 className="text-2xl font-bold mt-1">
                {riskMetrics.budgetUtilization.toFixed(3)}%
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">
            Percentage of your budget currently in use
          </p>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2"
              style={{ width: `${riskMetrics.budgetUtilization}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">AI Confidence</p>
              <h3 className="text-2xl font-bold mt-1">
                {aiMetrics.predictionAccuracy.toFixed(3)}%
              </h3>
            </div>
            <Brain className="w-8 h-8 opacity-80" />
          </div>
          <p className="mt-4 text-sm opacity-80">
            Last optimized {aiMetrics.lastOptimization}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 px-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Risk Analysis Over Time
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(3)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#ef4444"
                  name="Risk Score"
                />
                <Line
                  type="monotone"
                  dataKey="bid"
                  stroke="#22c55e"
                  name="Bid Amount"
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#3b82f6"
                  name="Threshold"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Decay Rate Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={decayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="decayRate"
                  stroke="#ef4444"
                  name="Actual Decay"
                />
                <Line
                  type="monotone"
                  dataKey="predictedDecay"
                  stroke="#3b82f6"
                  name="Predicted Decay"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 pb-0 bg-gray-100 min-h-screen">
        {/* Contract Parameters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg col-span-1">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Contract Parameters
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Minimum Bid</span>
                <span className="font-semibold">
                  {contractParams.minBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Current Bid</span>
                <span className="font-semibold">
                  {contractParams.currentBid} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Eviction Threshold</span>
                <span className="font-semibold">
                  {contractParams.evictionThreshold} ETH
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">User Stake</span>
                <span className="font-semibold">
                  {contractParams.userStake} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg col-span-1">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Risk Metrics
            </h2>
            <div className="space-y-4">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Bid Difference</span>
                  <span className="font-semibold">
                    {aiMetrics.bidDifference.toFixed(3)} ETH
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-blue-500 rounded-full" />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Time Pressure</span>
                  <span className="font-semibold">
                    {(aiMetrics.timePressure * 100).toFixed(3)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-yellow-500 rounded-full" />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Stake to Bid Ratio</span>
                  <span className="font-semibold">
                    {aiMetrics.stakeToBidRatio.toFixed(3)}x
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg col-span-1">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Eviction Risk Factors
            </h2>
            <div className="h-[300px] w-full">
              {" "}
              {/* Fixed height for better control */}
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={evictionRiskFactors}
                  margin={{ top: 20, right: 30, bottom: 20, left: 30 }} // Added margins
                >
                  <PolarGrid gridType="polygon" />
                  <PolarAngleAxis
                    dataKey="factor"
                    tick={{ fill: "#666", fontSize: 12 }} // Improved text readability
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }} // Adjusted tick size
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Recent Predictions Table */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Recent AI Actions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prediction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPredictions.map((pred, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pred.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.prediction === "Low Risk"
                            ? "bg-green-100 text-green-800"
                            : pred.prediction === "Medium Risk"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {pred.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(pred.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
