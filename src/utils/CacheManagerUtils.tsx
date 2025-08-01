import { ethers, BrowserProvider, Eip1193Provider } from "ethers";
import { cacheManagerConfig } from "@/config/CacheManagerConfig";
import { callContractMethod, ethCall } from "./EtherscanAPI";

export const getNetworkKeyByChainId = (chainId: number) => {
  if (chainId === 421614) return "arbitrum_sepolia";
  if (chainId === 42161) return "arbitrum_one";
  return null;
};

export const checkNetwork = async (provider: ethers.BrowserProvider) => {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== 421614 && chainId !== 42161) {
    throw new Error(`Please switch to Arbitrum Sepolia or Arbitrum One mainnet`);
  }
};

// Retry function with exponential backoff
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Etherscan API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retrying Etherscan API in ${delay}ms...`);
      await new Promise((resolve: any) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Initialize ethers.js Provider (only for wallet interactions, not for reading data)
export const getProvider = async (networkKey?: "arbitrum_sepolia" | "arbitrum_one") => {
  if (typeof window !== "undefined" && (window as any)?.ethereum) {
    try {
      // Use wallet provider for transactions
      const provider = new BrowserProvider((window as any).ethereum as Eip1193Provider);
      return provider;
    } catch (error) {
      console.warn("Wallet provider failed:", error);
      throw new Error("Wallet provider not available");
    }
  }
  
  throw new Error("No wallet provider available");
};

// Initialize Contract for transactions (using wallet provider)
export const getContract = async (networkKey: "arbitrum_sepolia" | "arbitrum_one") => {
  const provider = await getProvider(networkKey);
  const signer = await provider.getSigner();
  const config = cacheManagerConfig[networkKey];
  const contract = new ethers.Contract(
    config.contracts.cacheManager.address,
    config.contracts.cacheManager.abi,
    signer
  );
  return contract;
};

// New functions using Etherscan API for reading contract data
export const getCacheSize = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<string> => {
  console.log(`🔍 Fetching cache size via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for cacheSize()
    const functionSelector = ethers.id("cacheSize()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      throw new Error("Empty response from cacheSize call");
    }
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
    return decoded[0].toString();
  });
};

export const getDecay = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<string> => {
  console.log(`🔍 Fetching decay via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for decay()
    const functionSelector = ethers.id("decay()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      throw new Error("Empty response from decay call");
    }
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
    return decoded[0].toString();
  });
};

export const getQueueSize = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<string> => {
  console.log(`🔍 Fetching queue size via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for queueSize()
    const functionSelector = ethers.id("queueSize()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      throw new Error("Empty response from queueSize call");
    }
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
    return decoded[0].toString();
  });
};

export const getIsPaused = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<boolean> => {
  console.log(`🔍 Fetching pause status via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for isPaused()
    const functionSelector = ethers.id("isPaused()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      throw new Error("Empty response from isPaused call");
    }
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], result);
    return decoded[0];
  });
};

export const getEntries = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<any[]> => {
  console.log(`🔍 Fetching entries via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for getEntries()
    const functionSelector = ethers.id("getEntries()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      console.log("Empty response from getEntries call, returning empty array");
      return [];
    }
    
    try {
      // Try to decode as array of tuples (bytes32, uint64, uint192)[]
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["tuple(bytes32,uint64,uint192)[]"], 
        result
      );
      
      // Format the entries
      const entries = decoded[0].map((entry: any) => ({
        codeHash: entry[0],
        size: entry[1],
        ethBid: entry[2]
      }));
      
      console.log(`✅ Successfully decoded ${entries.length} entries`);
      return entries;
    } catch (decodeError: any) {
      console.error("Failed to decode entries:", decodeError);
      
      // Try alternative decoding if the first attempt fails
      try {
        // Try decoding as a simple array
        const alternativeDecoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes32[]", "uint64[]", "uint192[]"], result);
        
        const entries = alternativeDecoded[0].map((codeHash: any, index: number) => ({
          codeHash: codeHash,
          size: alternativeDecoded[1][index],
          ethBid: alternativeDecoded[2][index]
        }));
        
        console.log(`✅ Successfully decoded ${entries.length} entries using alternative method`);
        return entries;
      } catch (alternativeError: any) {
        console.error("Alternative decoding also failed:", alternativeError);
        throw new Error(`Failed to decode entries: ${decodeError.message}`);
      }
    }
  });
};

export const getMinBid = async (networkKey: "arbitrum_sepolia" | "arbitrum_one"): Promise<string> => {
  console.log(`🔍 Fetching min bid via Etherscan API for ${networkKey}`);
  
  return retryWithBackoff(async () => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;
    
    // Create function selector for minBid()
    const functionSelector = ethers.id("minBid()").slice(0, 10);
    
    const result = await ethCall(networkKey, contractAddress, functionSelector);
    
    if (result === "0x") {
      throw new Error("Empty response from minBid call");
    }
    
    // Decode the result
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
    return decoded[0].toString();
  });
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