import React, { useState, useEffect } from "react";
import { Brain, Settings, Loader, CirclePlus } from "lucide-react";
import { BrowserProvider, parseEther, Contract } from "ethers";
import { toast, Toaster } from "react-hot-toast";

import { DashboardData } from "../../../types";

interface ConfigureAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateData: (data: DashboardData) => void;
}

const VAULT_CONTRACT_ADDRESS = "0x191a2B9ED5bEf07f693BB4898bed37106439104E";
const VAULT_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const ConfigureAIModal: React.FC<ConfigureAIModalProps> = ({
  isOpen,
  onClose,
  onUpdateData,
}) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [monthlyBid, setMonthlyBid] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addressError, setAddressError] = useState<string>("");

  // Use useEffect to disable scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Disable scrolling
      document.body.style.overflow = "hidden";

      // Re-enable scrolling when modal closes or component unmounts
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

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
      // Get wallet address
      // await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Send transaction
      // Create contract instance for the ConfigVault
      const vaultContract = new Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_ABI,
        signer
      );

      // First, deposit the bid amount to the ConfigVault
      const depositTx = await vaultContract.deposit({
        value: parseEther(monthlyBid),
        gasLimit: 100000,
      });

      // Wait for deposit confirmation
      await depositTx.wait();
      toast.success("Deposit successful!");

      // Store the user's contract address (you can use this for your application's logic)
      console.log("User's contract address:", contractAddress);
      // Add any additional logic needed for the user's contract address here

      shouldUpdateData = true;

      if (shouldUpdateData) {
        // Call API with wallet address
        const response = await fetch("/api/dashboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": walletAddress,
          },
          body: JSON.stringify({ bidAmount: parseFloat(monthlyBid) }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch AI metrics");
        }

        const metrics = await response.json();
        onUpdateData(metrics);

        setContractAddress("");
        setMonthlyBid("");
        onClose();
      }
    } catch (error: any) {
      if (error.code === 4001 || error.message.includes("user rejected")) {
        toast.error("Transaction cancelled by user");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation for modal appearance
  // Use Tailwind for fade/scale effect
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50  backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ margin: "0", padding: "0" }}
    >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white rounded-2xl p-8 w-full max-w-md m-4 space-y-6 shadow-2xl border border-blue-100 animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-600 bg-blue-100 rounded-full p-1 shadow" />
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Add Balance</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label="Close modal"
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
        <div className="space-y-5">
          <div className="space-y-2 relative">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
              Contract Address
              <span className="text-xs text-gray-400" title="The address of your deployed contract.">(?)</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={handleAddressChange}
              className={`w-full px-4 py-3 border ${addressError ? "border-red-300" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/80 hover:bg-white text-gray-900 placeholder-gray-400 shadow-sm`}
            />
            {addressError && (
              <p className="text-xs text-red-600 mt-1">{addressError}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Enter the Ethereum address of your contract.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-1">
              Monthly Bid Budget (in ETH)
              <span className="text-xs text-gray-400" title="The maximum ETH you want to allocate per month.">(?)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={monthlyBid}
              onChange={(e) => setMonthlyBid(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/80 hover:bg-white text-gray-900 placeholder-gray-400 shadow-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Set your monthly budget for cache operations.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleConfigure}
            disabled={
              !contractAddress || !!addressError || !monthlyBid || isLoading
            }
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <CirclePlus className="w-5 h-5" />
            )}
            {isLoading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
      {/* Modal animation styles */}
      <style>{`
        .animate-fade-in-scale {
          animation: fadeInScale 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfigureAIModal;
