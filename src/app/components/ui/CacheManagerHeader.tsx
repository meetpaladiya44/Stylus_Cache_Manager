import React from "react";
import { WalletMinimal, ChevronDown } from "lucide-react";

interface CacheManagerHeaderProps {
  isConnected: boolean;
  setIsModalOpen: (open: boolean) => void;
  networkKey: "arbitrum_sepolia" | "arbitrum_one";
  onNetworkChange?: (network: "arbitrum_sepolia" | "arbitrum_one") => void;
}

const networkOptions = {
  arbitrum_sepolia: {
    name: "Arbitrum Sepolia",
    shortName: "Sepolia",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-300",
  },
  arbitrum_one: {
    name: "Arbitrum One",
    shortName: "Mainnet",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-300",
  },
};

const CacheManagerHeader: React.FC<CacheManagerHeaderProps> = ({ 
  isConnected, 
  setIsModalOpen,
  networkKey,
  onNetworkChange
}) => {
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = React.useState(false);
  const currentNetwork = networkOptions[networkKey];

  const handleNetworkSelect = (network: "arbitrum_sepolia" | "arbitrum_one") => {
    if (onNetworkChange) {
      onNetworkChange(network);
    }
    setIsNetworkDropdownOpen(false);
  };

  return (
    <div className="bg-zinc-900/90 border-b border-zinc-800/60 ">
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
            {/* Network Selector */}
            <div className="relative">
              <button
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 ${currentNetwork.bgColor} border ${currentNetwork.borderColor} rounded-xl transition-all duration-300 hover:bg-opacity-20`}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentNetwork.color}`}></div>
                <span className={`${currentNetwork.textColor} text-sm font-medium`}>
                  {currentNetwork.name}
                </span>
                <ChevronDown className={`w-4 h-4 ${currentNetwork.textColor} transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isNetworkDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsNetworkDropdownOpen(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Select Network
                      </p>
                      {(Object.keys(networkOptions) as Array<"arbitrum_sepolia" | "arbitrum_one">).map((key) => {
                        const network = networkOptions[key];
                        const isActive = key === networkKey;
                        return (
                          <button
                            key={key}
                            onClick={() => handleNetworkSelect(key)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                              isActive 
                                ? `${network.bgColor} ${network.borderColor} border` 
                                : 'hover:bg-zinc-700/50'
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${network.color}`}></div>
                            <div className="flex flex-col items-start">
                              <span className={`text-sm font-medium ${isActive ? network.textColor : 'text-zinc-200'}`}>
                                {network.name}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {key === 'arbitrum_sepolia' ? 'Testnet' : 'Production'}
                              </span>
                            </div>
                            {isActive && (
                              <div className="ml-auto">
                                <div className={`w-2 h-2 rounded-full ${network.textColor} bg-current`}></div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">Live Data</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900"
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
};

export default CacheManagerHeader; 