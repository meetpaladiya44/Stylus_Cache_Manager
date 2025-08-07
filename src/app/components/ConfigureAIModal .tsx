import React, { useState, useEffect } from "react";
import { Brain, Settings, Loader, CirclePlus } from "lucide-react";
import { BrowserProvider, parseEther, Contract, Eip1193Provider } from "ethers";
import { toast, Toaster } from "react-hot-toast";
import { useAccount } from "wagmi";

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

const MINIMUM_BALANCE_ETH = "0.000275"; // Equivalent to 1 USDC

const ConfigureAIModal: React.FC<ConfigureAIModalProps> = ({
  isOpen,
  onClose,
  onUpdateData,
}) => {
  const { address: userWalletAddress } = useAccount();
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string>("");

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

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBalanceAmount(value);

    if (!value) {
      setBalanceError("Balance amount is required");
    } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
      setBalanceError("Balance amount must be greater than 0");
    } else if (parseFloat(value) < parseFloat(MINIMUM_BALANCE_ETH)) {
      setBalanceError(
        `Minimum balance required is ${MINIMUM_BALANCE_ETH} ETH (equivalent to 1 USDC)`
      );
    } else {
      setBalanceError("");
    }
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    toast.loading("Processing deposit...", { id: "deposit-loading" });

    try {
      // Validate user wallet address
      if (!userWalletAddress) {
        toast.error("Please connect your wallet first", {
          id: "deposit-loading",
        });
        return;
      }
      // Wallet address format check
      if (!/^0x[a-fA-F0-9]{40}$/.test(userWalletAddress)) {
        toast.error("Invalid wallet address format", { id: "deposit-loading" });
        return;
      }
      // Check if MetaMask is available
      if (!window.ethereum) {
        toast.error(
          "MetaMask is not installed. Please install MetaMask to continue.",
          { id: "deposit-loading" }
        );
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
      // Get network information
      const network = await provider.getNetwork();
      let networkName = network.name;
      if (networkName === "arbitrum") networkName = "arbitrum-one";
      console.log("networkName", networkName);
      // Validate network - only allow arbitrum-sepolia and arbitrum-one
      if (networkName !== "arbitrum-sepolia" && networkName !== "arbitrum-one") {
        toast.error(
          "Wrong network detected! Please switch to Arbitrum Sepolia or Arbitrum One mainnet to continue.",
          { id: "deposit-loading" }
        );
        return;
      }
      // Validate balance values are numeric and > 0
      if (
        isNaN(parseFloat(balanceAmount)) ||
        parseFloat(balanceAmount) <= 0
      ) {
        toast.error("Balance amount must be a valid number greater than 0", { id: "deposit-loading" });
        return;
      }
      // Create contract instance for the ConfigVault
      const vaultContract = new Contract(
        VAULT_CONTRACT_ADDRESS,
        VAULT_ABI,
        signer
      );
      toast.loading("Confirming transaction...", { id: "deposit-loading" });
      // Deposit the balance amount to the ConfigVault
      const depositTx = await vaultContract.deposit({
        value: parseEther(balanceAmount),
        gasLimit: 100000,
      });
      // Transaction hash format check
      if (!/^0x[a-fA-F0-9]{64}$/.test(depositTx.hash)) {
        toast.error("Invalid transaction hash format", { id: "deposit-loading" });
        return;
      }
      toast.loading("Waiting for transaction confirmation...", {
        id: "deposit-loading",
      });
      // Wait for deposit confirmation
      const receipt = await depositTx.wait();
      // Calculate gas fees
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.gasPrice || depositTx.gasPrice;
      const totalGasFees = gasUsed * gasPrice;
      // Store transaction data in MongoDB
      const transactionData = {
        userWalletAddress: walletAddress,
        txHash: depositTx.hash,
        network: networkName,
        minBalanceValue: balanceAmount,
        timestamp: new Date().toISOString(),
        dynamicUpdatedBalVal: balanceAmount,
        totalGasCost: totalGasFees.toString(),
      };

      // Call MongoDB API to store transaction data
      const response = await fetch("/api/balance/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Failed to store transaction data in MongoDB:", errorData);
        toast.error(`Database error: ${errorData.error || 'Failed to store transaction data'}`, {
          id: "deposit-loading"
        });
        return;
      } else {
        console.log("Transaction data stored successfully in MongoDB");
      }

      toast.success(
        "Balance added successfully! Automation service is now configured.",
        { id: "deposit-loading" }
      );

      // Clear form and close modal
      setBalanceAmount("");
      onClose();
    } catch (error: any) {
      console.error("Error in handleConfigure:", error);

      if (error.code === 4001 || error.message.includes("user rejected")) {
        toast.error("Transaction cancelled by user", { id: "deposit-loading" });
      } else if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction", {
          id: "deposit-loading",
        });
      } else if (error.message.includes("MetaMask")) {
        toast.error("MetaMask error: " + error.message, {
          id: "deposit-loading",
        });
      } else {
        toast.error(
          "Transaction failed: " + (error.message || "Unknown error"),
          { id: "deposit-loading" }
        );
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
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Add Balance
            </h2>
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
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-300 flex items-center gap-1">
              Balance Amount (in ETH)
              <span
                className="text-xs text-zinc-500"
                title="Minimum 0.000275 ETH required for automation."
              >
                (?)
              </span>
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder={MINIMUM_BALANCE_ETH}
              value={balanceAmount}
              onChange={handleBalanceChange}
              className={`w-full px-4 py-3 border ${
                balanceError ? "border-red-500/50" : "border-zinc-600/50"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400 shadow-sm`}
            />
            {balanceError && (
              <p className="text-xs text-red-400 mt-1">{balanceError}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              Minimum {MINIMUM_BALANCE_ETH} ETH (≈ 1 USDC) required for
              automation and platform charges.
            </p>
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
            disabled={
              isLoading ||
              !!balanceError ||
              !balanceAmount ||
              parseFloat(balanceAmount || "0") < parseFloat(MINIMUM_BALANCE_ETH)
            }
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
            <span className="text-sm font-semibold text-blue-300">
              Automation Service
            </span>
          </div>
          <p className="text-xs text-blue-200 leading-relaxed">
            Our backend manages bids and operations using your balance, while
            also monitoring and mitigating eviction risks automatically
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
