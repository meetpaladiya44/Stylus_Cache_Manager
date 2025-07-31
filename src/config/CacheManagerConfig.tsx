import ContractABI from "@/libs/StylusContractABI.json";
import ArbitrumOneABI from "@/libs/CacheManagerArbitrumOne.json";

export const cacheManagerConfig = {
  arbitrum_sepolia: {
    chainId: 421614,
    chainName: "Arbitrum Sepolia Testnet",
    rpc: {
      infura: process.env.NEXT_PUBLIC_INFURA_API_KEY 
        ? `https://arbitrum-sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
        : null,
      alchemy: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://arb-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : null,
      default: "https://sepolia-rollup.arbitrum.io/rpc"
    },
    explorer: "https://sepolia.arbiscan.io",
    contracts: {
      cacheManager: {
        name: "CacheManager",
        address: "0x0C9043D042aB52cFa8d0207459260040Cca54253",
        abi: ContractABI,
      },
    },
  },
  arbitrum_one: {
    chainId: 42161,
    chainName: "Arbitrum One Mainnet",
    rpc: {
      infura: process.env.NEXT_PUBLIC_INFURA_API_KEY
        ? `https://arbitrum-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
        : null,
      alchemy: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : null,
      default: "https://arb1.arbitrum.io/rpc"
    },
    explorer: "https://explorer.arbitrum.io",
    contracts: {
      cacheManager: {
        name: "CacheManager",
        address: "0x51dEDBD2f190E0696AFbEE5E60bFdE96d86464ec",
        abi: ArbitrumOneABI,
      },
    },
  },
};
