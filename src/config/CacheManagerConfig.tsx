import ContractABI from "@/libs/StylusContractABI.json";

export const cacheManagerConfig = {
  arbitrum_one: {
    chainId: 421614,
    chainName: "Arbitrum Sepolia Testnet",
    contracts: {
      cacheManager: {
        name: "CacheManager",
        // address: "0xCed9cA39eD3105Fc3c88BAbfE2483BC69c861197",
        address: "0x0C9043D042aB52cFa8d0207459260040Cca54253",
        abi: ContractABI.abi,
      },
    },
  },
};
