import React, { useState, useEffect } from "react";
import { Brain, Settings, Loader, Check, AlertTriangle, Info, ArrowRight, Shield } from "lucide-react";
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
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [isEligibilityChecking, setIsEligibilityChecking] = useState<boolean>(false);
  const [eligibilityResult, setEligibilityResult] = useState<string | null>(null);

  // Use useEffect to disable scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      
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
    setEligibilityResult(null);

    if (!address) {
      setAddressError("Contract address is required");
    } else if (!isValidEthAddress(address)) {
      setAddressError("Invalid Ethereum address format");
    } else {
      setAddressError("");
    }
  };

  const checkEligibility = () => {
    setIsEligibilityChecking(true);
    
    // Simulate checking eligibility
    setTimeout(() => {
      const randomResult = Math.random() > 0.3;
      setEligibilityResult(randomResult ? "eligible" : "ineligible");
      setIsEligibilityChecking(false);
    }, 1500);
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    let shouldUpdateData = false;

    try {
      // Get wallet address
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

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
      toast.success("Contract successfully submitted to cache manager!");

      // Store the user's contract address
      console.log("User's contract address:", contractAddress);

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
          throw new Error("Failed to fetch cache metrics");
        }

        const metrics = await response.json();
        onUpdateData(metrics);

        setContractAddress("");
        setMonthlyBid("");
        onClose();
      }
    } catch (error: any) {
      if (error.code === 4001 || error.message.includes("user rejected")) {
        toast.error("Transaction cancelled by user", {
          duration: 3000,
        });
      } else {
        toast.error("Something went wrong. Please try again.", {
          duration: 3000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center w-full max-w-xs">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold`}>1</div>
          <div className={`flex-1 h-1 mx-2 ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold`}>2</div>
          <div className={`flex-1 h-1 mx-2 ${activeStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold`}>3</div>
        </div>
      </div>
    );
  };

  const renderStepOne = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Contract Address
            </label>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          
          {showInfo && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-3 border border-blue-100 flex items-start">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>Enter your smart contract address that you want to be cached in Arbitrum&apos;s cache manager for improved gas efficiency.</p>
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              placeholder="0x..."
              value={contractAddress}
              onChange={handleAddressChange}
              className={`w-full px-3 py-3 border ${
                addressError ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-10`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {addressError && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" /> {addressError}
            </p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={checkEligibility}
            disabled={!contractAddress || !!addressError || isEligibilityChecking}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isEligibilityChecking ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
            {isEligibilityChecking ? "Checking Eligibility..." : "Check Eligibility"}
          </button>
        </div>

        {eligibilityResult && (
          <div className={`mt-4 p-4 rounded-lg ${eligibilityResult === "eligible" ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
            {eligibilityResult === "eligible" ? (
              <div className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">Eligible for caching!</p>
                  <p className="text-sm text-green-700">Your contract can benefit from Arbitrum cache manager.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Not eligible for caching</p>
                  <p className="text-sm text-red-700">This contract cannot benefit from being placed in cache manager.</p>
                </div>
              </div>
            )}
            
            {eligibilityResult === "eligible" && (
              <button
                onClick={() => setActiveStep(2)}
                className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4" /> Continue
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStepTwo = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Monthly Bid Budget (ETH)
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={monthlyBid}
              onChange={(e) => setMonthlyBid(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path fill="currentColor" d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Higher bids increase the chance of your contract being included in the cache manager.</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 my-4">
          <h4 className="text-sm font-medium text-blue-800 flex items-center">
            <Info className="w-4 h-4 mr-2" /> Bidding Information
          </h4>
          <ul className="mt-2 text-xs text-blue-700 space-y-1">
            <li className="flex items-start">
              <span className="inline-block w-1 h-1 rounded-full bg-blue-700 mt-1.5 mr-2"></span>
              <span>Bids are processed on a monthly basis</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1 h-1 rounded-full bg-blue-700 mt-1.5 mr-2"></span>
              <span>Unsuccessful bids will be automatically refunded</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1 h-1 rounded-full bg-blue-700 mt-1.5 mr-2"></span>
              <span>Higher gas saving potential increases chances of selection</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={() => setActiveStep(1)}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setActiveStep(3)}
            disabled={!monthlyBid}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Review
          </button>
        </div>
      </div>
    );
  };

  const renderStepThree = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contract Address</span>
              <span className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{contractAddress}</span>
            </div>
            
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Bid</span>
              <span className="text-sm font-medium text-gray-900">{monthlyBid} ETH</span>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mt-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Important Disclaimer</h4>
              <p className="text-xs text-amber-700 mt-1">
                Your contract will only be added to Arbitrum&apos;s cache manager if:
              </p>
              <ul className="mt-2 text-xs text-amber-700 space-y-1 pl-4 list-disc">
                <li>There is available space in the cache manager</li>
                <li>Your contract&apos;s function execution can be gas efficient when cached</li>
                <li>Your bid is competitive compared to other submissions</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={() => setActiveStep(2)}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfigure}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {isLoading ? "Processing..." : "Submit Contract"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all animate-fadeIn border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {activeStep === 1 && "Contract Registration"}
                {activeStep === 2 && "Set Bid Amount"}
                {activeStep === 3 && "Review & Submit"}
              </h2>
              <p className="text-xs text-gray-500">Arbitrum Cache Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
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

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        {activeStep === 1 && renderStepOne()}
        {activeStep === 2 && renderStepTwo()}
        {activeStep === 3 && renderStepThree()}
      </div>
    </div>
  );
};

export default ConfigureAIModal;