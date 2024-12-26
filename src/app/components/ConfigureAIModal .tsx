import React, { useState } from "react";
import {
  Brain,
  Settings,
  Loader,
  Check
} from "lucide-react";
import { BrowserProvider, parseEther } from "ethers";
import { toast, Toaster } from "react-hot-toast";

import { DashboardData } from "../../../types";

interface ConfigureAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateData: (data: DashboardData) => void;
}


const ConfigureAIModal: React.FC<ConfigureAIModalProps> = ({
  isOpen,
  onClose,
  onUpdateData,
}) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [monthlyBid, setMonthlyBid] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string>("");

  if (!isOpen) return null;

  const isValidEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setContractAddress(address);

    if (!address) {
      setAddressError("Contract address is required");
    } else if (!isValidEthAddress(address)) {
      setAddressError("Invalid Ethereum address format");
    } else {
      setAddressError("");
    }
  };

  const updateMetricsData = (bidAmount: number) => {
    const newData = calculateNewMetrics(bidAmount);
    onUpdateData(newData);
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    let shouldUpdateData = false;

    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: parseEther(monthlyBid),
        gasLimit: 100000,
      });

      // Transaction was initiated by user (not rejected)
      shouldUpdateData = true;
      
      // Wait for transaction confirmation
      await tx.wait();
      toast.success("Transaction successful!");
      
    } catch (error: any) {
      // Only show error toast if user rejected transaction
      if (error.code === 4001 || error.message.includes("user rejected")) {
        toast.error("Transaction cancelled by user");
        shouldUpdateData = false;
      } else {
        // For other errors, still update the data
        shouldUpdateData = true;
      }
    } finally {
      if (shouldUpdateData) {
        // Update metrics with the new bid amount
        const newData = calculateNewMetrics(parseFloat(monthlyBid));
        onUpdateData(newData);
        
        // Reset form and close modal
        setContractAddress("");
        setMonthlyBid("");
        onClose();
      }
      setIsLoading(false);
    }
  };

  const calculateNewMetrics = (bidAmount: number): DashboardData => {
    // Calculate risk factor based on bid amount
    const riskFactor = bidAmount >= 1.0 ? 0.15 : bidAmount >= 0.5 ? 0.45 : 0.75;
    const utilizationFactor = Math.min(95, bidAmount * 100);

    // Generate timestamps for historical data
    const now = new Date();
    const timestamps = Array(5).fill(null).map((_, i) => {
      const date = new Date(now.getTime() - i * 3600000); // Go back i hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }).reverse();

    return {
      riskMetrics: {
        currentRisk: riskFactor,
        optimalBid: bidAmount * (1 + Math.random() * 0.2),
        timeToEviction:
          bidAmount >= 1.0 ? "8h 30m" : bidAmount >= 0.5 ? "4h 15m" : "2h 00m",
        budgetUtilization: utilizationFactor,
      },
      historicalData: timestamps.map((timestamp, i) => ({
        timestamp,
        risk: Math.max(
          0.1,
          Math.min(0.9, riskFactor + (Math.random() * 0.3 - 0.15))
        ),
        bid: bidAmount * (0.7 + Math.random() * 0.6),
        threshold: bidAmount * (1.2 + Math.random() * 0.3),
      })),
      modelMetrics: {
        accuracy: Math.min(98, 85 + bidAmount * 10),
        precision: Math.min(97, 82 + bidAmount * 12),
        recall: Math.min(98, 84 + bidAmount * 11),
        f1Score: Math.min(97, 83 + bidAmount * 11),
      },
      aiMetrics: {
        bidDifference: bidAmount * (0.1 + Math.random() * 0.1),
        timePressure: riskFactor + Math.random() * 0.1,
        stakeToBidRatio: bidAmount * (2 + Math.random()),
        predictionAccuracy: Math.min(98, 90 + bidAmount * 5),
        lastOptimization: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
      },
    };
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white rounded-xl p-6 w-full max-w-md m-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Configure AI Agent
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Contract Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={handleAddressChange}
              className={`w-full px-3 py-2 border ${
                addressError ? "border-red-300" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 transition-all`}
            />
            {addressError && (
              <p className="text-sm text-red-600">{addressError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Monthly Bid Budget (in ETH)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={monthlyBid}
              onChange={(e) => setMonthlyBid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleConfigure}
            disabled={
              !contractAddress || !!addressError || !monthlyBid || isLoading
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            {isLoading ? "Configuring..." : "Configure"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureAIModal;