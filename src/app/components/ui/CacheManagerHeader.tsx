import React from "react";
import { WalletMinimal } from "lucide-react";

interface CacheManagerHeaderProps {
  isConnected: boolean;
  setIsModalOpen: (open: boolean) => void;
  ConnectKitButton: React.ElementType;
}

const CacheManagerHeader: React.FC<CacheManagerHeaderProps> = ({ isConnected, setIsModalOpen, ConnectKitButton }) => (
  <div className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/60 sticky top-0 z-40">
    <div className="px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 bg-clip-text text-transparent">
            Cache Manager Analytics
          </h1>
          <p className="text-zinc-400 text-lg">
            Real-time insights and management for your cache operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">Live Data</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <div className="flex items-center gap-2">
              <WalletMinimal className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Add Balance</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CacheManagerHeader; 