import { cacheManagerConfig } from "@/config/CacheManagerConfig";

// Etherscan API configuration
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "Q29PDS3454IAKM89NH2HI55E6KP72USBJZ";

if (!ETHERSCAN_API_KEY) {
    console.warn("⚠️ Etherscan API key not found. Please set NEXT_PUBLIC_ETHERSCAN_API_KEY environment variable.");
}

// Network-specific Etherscan API URLs and chain IDs
const ETHERSCAN_CONFIG = {
    arbitrum_sepolia: {
        baseUrl: "https://api.etherscan.io/v2/api",
        chainId: "421614"
    },
    arbitrum_one: {
        baseUrl: "https://api.etherscan.io/v2/api",
        chainId: "42161"
    }
};

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200; // 200ms between requests to avoid rate limiting
const MAX_RETRIES = 3;

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = MAX_RETRIES,
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
            const delayTime = baseDelay * Math.pow(2, attempt);
            console.log(`Retrying Etherscan API in ${delayTime}ms...`);
            await delay(delayTime);
        }
    }

    throw lastError;
};

// Generic Etherscan API call function
const callEtherscanAPI = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    params: Record<string, string>
): Promise<any> => {
    const config = ETHERSCAN_CONFIG[networkKey];
    const url = new URL(config.baseUrl);

    // Add API key, chain ID, and other parameters
    const searchParams = new URLSearchParams({
        ...params,
        chainid: config.chainId,
        apikey: ETHERSCAN_API_KEY
    });

    url.search = searchParams.toString();

    console.log(`🌐 Calling Etherscan API: ${url.toString()}`);

    // Add rate limiting delay
    await delay(RATE_LIMIT_DELAY);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Etherscan API HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log("data", data)

    if (data.status === "0" && data.message !== "No transactions found" && data.message !== "No records found") {
        throw new Error(`Etherscan API error: ${data.message || data.result}`);
    }

    return data;
};

// Function to call contract read methods via Etherscan API
export const callContractMethod = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    methodName: string,
    parameters: string[] = []
): Promise<any> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params = {
            module: "contract",
            action: "read",
            address: contractAddress,
            functionname: methodName,
            ...(parameters.length > 0 && { parameters: parameters.join(",") })
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return result.result;
        } else {
            throw new Error(`Contract call failed: ${result.message || result.result}`);
        }
    });
};

// Function to get contract ABI from Etherscan
export const getContractABI = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one"
): Promise<any[]> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params = {
            module: "contract",
            action: "getabi",
            address: contractAddress
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return JSON.parse(result.result);
        } else {
            throw new Error(`Failed to get ABI: ${result.message || result.result}`);
        }
    });
};

// Function to get contract source code
export const getContractSource = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one"
): Promise<any> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params = {
            module: "contract",
            action: "getsourcecode",
            address: contractAddress
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return result.result[0];
        } else {
            throw new Error(`Failed to get source code: ${result.message || result.result}`);
        }
    });
};

// Function to get transaction list for a contract
export const getContractTransactions = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    startBlock: number = 0,
    endBlock: number = 999999999,
    page: number = 1,
    offset: number = 10000
): Promise<any[]> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params = {
            module: "account",
            action: "txlist",
            address: contractAddress,
            startblock: startBlock.toString(),
            endblock: endBlock.toString(),
            page: page.toString(),
            offset: offset.toString(),
            sort: "desc"
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return result.result;
        } else if (result.message === "No transactions found") {
            return [];
        } else {
            throw new Error(`Failed to get transactions: ${result.message || result.result}`);
        }
    });
};

// Function to get internal transactions for a contract
export const getContractInternalTransactions = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    startBlock: number = 0,
    endBlock: number = 999999999,
    page: number = 1,
    offset: number = 10000
): Promise<any[]> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params = {
            module: "account",
            action: "txlistinternal",
            address: contractAddress,
            startblock: startBlock.toString(),
            endblock: endBlock.toString(),
            page: page.toString(),
            offset: offset.toString(),
            sort: "desc"
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return result.result;
        } else if (result.message === "No transactions found") {
            return [];
        } else {
            throw new Error(`Failed to get internal transactions: ${result.message || result.result}`);
        }
    });
};

// Function to get logs for a contract
export const getContractLogs = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    fromBlock: number = 0,
    toBlock: number = 999999999,
    topic0?: string,
    topic1?: string,
    topic2?: string,
    topic3?: string
): Promise<any[]> => {
    const config = cacheManagerConfig[networkKey];
    const contractAddress = config.contracts.cacheManager.address;

    return retryWithBackoff(async () => {
        const params: Record<string, string> = {
            module: "logs",
            action: "getLogs",
            address: contractAddress,
            fromBlock: fromBlock.toString(),
            toBlock: toBlock.toString()
        };

        // Add topic filters if provided
        if (topic0) params.topic0 = topic0;
        if (topic1) params.topic1 = topic1;
        if (topic2) params.topic2 = topic2;
        if (topic3) params.topic3 = topic3;

        const result = await callEtherscanAPI(networkKey, params);

        if (result.status === "1") {
            return result.result;
        } else if (result.message === "No records found") {
            return [];
        } else {
            throw new Error(`Failed to get logs: ${result.message || result.result}`);
        }
    });
};

// Function to get the latest block number
export const getLatestBlockNumber = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one"
): Promise<number> => {
    return retryWithBackoff(async () => {
        const params = {
            module: "proxy",
            action: "eth_blockNumber"
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.result) {
            return parseInt(result.result, 16);
        } else {
            throw new Error(`Failed to get latest block: ${result.message || result.result}`);
        }
    });
};

// Function to call eth_call via Etherscan proxy
export const ethCall = async (
    networkKey: "arbitrum_sepolia" | "arbitrum_one",
    to: string,
    data: string,
    tag: string = "latest"
): Promise<string> => {
    return retryWithBackoff(async () => {
        const params = {
            module: "proxy",
            action: "eth_call",
            to,
            data,
            tag
        };

        const result = await callEtherscanAPI(networkKey, params);

        if (result.result) {
            return result.result;
        } else {
            throw new Error(`eth_call failed: ${result.message || result.error}`);
        }
    });
};