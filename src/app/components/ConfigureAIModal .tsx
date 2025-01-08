import React, { useState } from "react";
import { Brain, Settings, Loader, Check } from "lucide-react";
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
        // Call external calculation API
        const apiKey = process.env.NEXT_PUBLIC_CALCULATION_API_KEY;
        const response = await fetch("http://localhost:4000/calculate", {
          method: "POST",
          headers: {  
            "Content-Type": "application/json",
            ...(apiKey && { "x-api-key": apiKey }), // Only include x-api-key if it exists
          },
          body: JSON.stringify({ bidAmount: parseFloat(monthlyBid) }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch AI metrics");
        }

        const metrics = await response.json();
        onUpdateData(metrics);

        // Reset form and close modal
        setContractAddress("");
        setMonthlyBid("");
        onClose();
      }
      setIsLoading(false);
    }
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
