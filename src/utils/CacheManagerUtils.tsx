import { ethers, BrowserProvider, Eip1193Provider } from "ethers";
import { cacheManagerConfig } from "@/config/CacheManagerConfig";

export const checkNetwork = async (provider: ethers.BrowserProvider) => {
  const network = await provider.getNetwork();
  const requiredChainId = 421614; // Sepolia testnet
  if (Number(network.chainId) !== requiredChainId) {
    throw new Error(`Please switch to Sepolia testnet`);
  }
};

// Initialize ethers.js Provider
export const getProvider = async () => {
  if (typeof window !== "undefined" && (window as any)?.ethereum) {
    const provider = new BrowserProvider((window as any).ethereum as Eip1193Provider);
    return provider;
  } else {
    throw new Error("MetaMask is not installed");
  }
};

// Initialize Contract
export const getContract = async () => {
  console.log("inside get contract");

  const provider = await getProvider();
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    cacheManagerConfig.arbitrum_one.contracts.cacheManager.address,
    cacheManagerConfig.arbitrum_one.contracts.cacheManager.abi,
    signer
  );
  console.log("contract::", contract);
  return contract;
};

// Helper function to format decay rate
function formatDecayRate(decayValue: any) {
  // Convert to bids per second
  const decayPerSecond = Number(decayValue) / 1e18; // Assuming bid values are in ETH (18 decimals)

  // Convert to more readable time periods
  const decayPerMinute = decayPerSecond * 60;
  const decayPerHour = decayPerMinute * 60;
  const decayPerDay = decayPerHour * 24;

  return {
    perSecond: `${decayPerSecond.toFixed(9)} ETH/sec`,
    perMinute: `${decayPerMinute.toFixed(9)} ETH/min`,
    perHour: `${decayPerHour.toFixed(9)} ETH/hour`,
    perDay: `${decayPerDay.toFixed(9)} ETH/day`,
  };
}

// Usage in your component
export const displayDecay = (rawDecay: any) => {
  const rates = formatDecayRate(rawDecay);
  return (
    <div>
      <ul>
        {/* <li>{rates.perSecond}</li>
        <li>{rates.perMinute}</li>
        <li>{rates.perHour}</li> */}
        <li>{rates.perDay}</li>
      </ul>
    </div>
  );
};

export const estimateGasWithBuffer = async (
  contract: ethers.Contract,
  functionName: string,
  args: any[]
) => {
  const gasEstimate = await contract
    .getFunction(functionName)
    .estimateGas(...args);
  console.log("gasEstimate", gasEstimate);
  return (gasEstimate * BigInt(120)) / BigInt(100);
};
