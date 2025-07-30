import ContractABI from "@/libs/StylusContractABI.json";
import ArbitrumOneABI from "@/libs/CacheManagerArbitrumOne.json";

export const cacheManagerConfig = {
  arbitrum_sepolia: {
    chainId: 421614,
    chainName: "Arbitrum Sepolia Testnet",
    contracts: {
      cacheManager: {
        name: "CacheManager",
        address: "0x0C9043D042aB52cFa8d0207459260040Cca54253",
        abi: ContractABI.abi,
      },
    },
  },
  arbitrum_one: {
    chainId: 42161,
    chainName: "Arbitrum One Mainnet",
    rpc: "arbitrum-mainnet.infura.io",
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
