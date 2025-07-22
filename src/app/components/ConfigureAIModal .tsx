import React, { useState, useEffect } from "react";
import { Brain, Settings, Loader, CirclePlus } from "lucide-react";
import { BrowserProvider, parseEther, Contract, Eip1193Provider } from "ethers";
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
      // Check if MetaMask is available
      if (!window.ethereum) {
        toast.error("MetaMask is not installed. Please install MetaMask to continue.");
        return;
      }

      // Type assertion for ethereum provider
      const ethereum = window.ethereum as unknown as Eip1193Provider;

      // Request account access
      await ethereum.request({ method: "eth_requestAccounts" });

      // Create provider with proper type checking
      const provider = new BrowserProvider(ethereum);
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
        const response = await fetch("/api/profile", {
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
      } else if (error.message.includes("MetaMask")) {
        toast.error("MetaMask error: " + error.message);
      } else {
        toast.error("An error occurred: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation for modal appearance
  // Use Tailwind for fade/scale effect
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ margin: "0", padding: "0" }}
    >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-zinc-800/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md m-4 space-y-6 shadow-2xl border border-zinc-700/60 animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700/50 pb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-400 bg-blue-500/20 rounded-full p-1 shadow border border-blue-500/30" />
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Add Balance</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-zinc-700/50"
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
            <label className="block text-sm font-semibold text-zinc-300 flex items-center gap-1">
              Contract Address
              <span className="text-xs text-zinc-500" title="The address of your deployed contract.">(?)</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={handleAddressChange}
              className={`w-full px-4 py-3 border ${addressError ? "border-red-500/50" : "border-zinc-600/50"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400 shadow-sm`}
            />
            {addressError && (
              <p className="text-xs text-red-400 mt-1">{addressError}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">Enter the Ethereum address of your contract.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300 flex items-center gap-1">
              Monthly Bid Budget (in ETH)
              <span className="text-xs text-zinc-500" title="The maximum ETH you want to allocate per month.">(?)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={monthlyBid}
              onChange={(e) => setMonthlyBid(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400 shadow-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">Set your monthly budget for automated bidding.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-zinc-600/50 text-zinc-300 rounded-lg hover:bg-zinc-700/50 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfigure}
            disabled={isLoading || !!addressError || !contractAddress || !monthlyBid}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <CirclePlus className="w-4 h-4" />
                Add Balance
              </>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">AI Agent Configuration</span>
          </div>
          <p className="text-xs text-blue-200 leading-relaxed">
            Your AI agent will automatically manage bidding for the specified contract using your monthly budget allocation.
          </p>
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
