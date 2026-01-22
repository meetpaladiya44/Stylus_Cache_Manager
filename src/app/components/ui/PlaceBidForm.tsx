import React from "react";
import { Database, Check, Bot } from "lucide-react";

interface PlaceBidFormProps {
  contractAddress: string;
  addressError: string;
  handleAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bidAmount: string;
  setBidAmount: (v: string) => void;
  handlePlaceBid: () => void;
  isLoading: boolean;
  minBid: string | null;
  handleAskAI: () => void;
  isConnected: boolean;
}

const PlaceBidForm: React.FC<PlaceBidFormProps> = ({
  contractAddress,
  addressError,
  handleAddressChange,
  bidAmount,
  setBidAmount,
  handlePlaceBid,
  isLoading,
  minBid,
  handleAskAI,
  isConnected,
}) => (
  <div className="group relative bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors duration-300 border border-green-500/20">
          <Database className="w-6 h-6 text-green-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-100">Place a Bid</h2>
          <p className="text-sm text-zinc-400">Submit your cache entry bid</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="block text-sm font-semibold text-zinc-300 mb-2">Contract Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={contractAddress}
            onChange={handleAddressChange}
            className="w-full px-4 py-3 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400"
          />
          {addressError && (
            <p className="text-sm text-red-400 mt-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {addressError}
            </p>
          )}
          {!addressError && contractAddress && (
            <div className="absolute right-3 top-11 flex items-center gap-2">
              <Check className="text-green-400 w-5 h-5" />
              <span className="text-xs text-green-300 font-medium">Valid</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">Bid Value (ETH)</label>
          <input
            type="number"
            placeholder="0.0"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-100 placeholder-zinc-400"
            step="0.000000000000000001"
          />
        </div>
        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-300 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Please connect your wallet to place a bid</span>
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePlaceBid}
            className="flex-1 group relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !contractAddress || !bidAmount || !isConnected}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Placing Bid...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Place Bid
                </>
              )}
            </span>
          </button>
          <button
            onClick={handleAskAI}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-800"
          >
            <span className="flex items-center justify-center gap-2">
              <Bot className="w-4 h-4 transition-transform group-hover:scale-110" />
              Ask AI
            </span>
          </button>
        </div>
        {minBid && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Minimum Bid Required: {minBid} ETH</span>
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default PlaceBidForm; 