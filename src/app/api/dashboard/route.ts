import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

// Optimized interface with only required fields for dashboard
interface Contract {
  contractAddress: string;
  network: string;
  gasSaved: number;
  minBidRequired: number;
  deployedBy: string;
  usingUI?: boolean;
  byCLI?: boolean;
  usingAutoCacheFlag?: boolean;
  txHash: string;
  evictionThresholdDate?: string;
  bidPlacedAt?: string;
}

interface Stats {
  totalGasSaved: number;
  totalContracts: number;
  avgMinBid: number;
  uniqueDeployers: number;
  networks: string[];
}

interface LeaderboardResponse {
  success: boolean;
  data?: Contract[];
  stats?: Stats;
  networks?: string[];
  pagination?: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
    hasPrev: boolean;
  };
  error?: string;
  message?: string;
}

// Ultra-lean field projection - only essential fields
const CONTRACT_PROJECTION = {
  _id: 0,
  contractAddress: 1,
  network: 1,
  gasSaved: 1,
  minBidRequired: 1,
  deployedBy: 1,
  usingUI: 1,
  byCLI: 1,
  usingAutoCacheFlag: 1,
  txHash: 1,
  evictionThresholdDate: 1,
  bidPlacedAt: 1
};

// Database sort mapping for optimal MongoDB queries
const SORT_MAPPING: { [key: string]: string } = {
  gasSaved: 'gasSaved',
  minBidRequired: 'minBidRequired', 
  contractAddress: 'contractAddress',
  deployedBy: 'deployedBy',
  network: 'network',
  expiry: 'evictionThresholdDate'
};

// Build optimized sort object
const buildSortObject = (sortBy: string, sortOrder: string): { [key: string]: 1 | -1 } => {
  const field = SORT_MAPPING[sortBy] || 'gasSaved';
  const order = sortOrder === 'asc' ? 1 : -1;
  return { [field]: order };
};

// Optimized aggregation pipeline for stats
const buildStatsAggregation = (matchStage: any): any[] => [
  ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
  {
    $group: {
      _id: null,
      totalGasSaved: { $sum: { $toInt: "$gasSaved" } },
      totalContracts: { $sum: 1 },
      avgMinBid: { $avg: { $toDouble: "$minBidRequired" } },
      uniqueDeployers: { $addToSet: "$deployedBy" },
      networks: { $addToSet: "$network" }
    }
  },
  {
    $project: {
      _id: 0,
      totalGasSaved: 1,
      totalContracts: 1,
      avgMinBid: { $round: ["$avgMinBid", 6] },
      uniqueDeployers: { $size: "$uniqueDeployers" },
      networks: 1
    }
  }
];

export async function GET(request: NextRequest): Promise<NextResponse<LeaderboardResponse>> {
  const startTime = performance.now();
  
  try {
    // Extract and validate parameters
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network") || "all";
    const sortBy = searchParams.get("sortBy") || "gasSaved";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    // Connect to database
    const client = await getMongoClient();
    const db = client.db("smartcache");
    const collection = db.collection("contracts");

    // Build query filter and sort
    const matchStage = network !== "all" ? { network } : {};
    const sortObj = buildSortObject(sortBy, sortOrder);

    // Execute all queries in parallel for optimal performance
    const [contractsResult, statsResult, networksResult, totalCount] = await Promise.all([
      // Query 1: Get paginated contracts with sorting
      collection
        .find(matchStage, { projection: CONTRACT_PROJECTION })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray(),

      // Query 2: Get aggregated stats
      collection
        .aggregate(buildStatsAggregation(matchStage))
        .toArray(),

      // Query 3: Get all available networks
      collection.distinct("network"),

      // Query 4: Get total count for pagination
      collection.countDocuments(matchStage)
    ]);

    // Process contracts (already in correct format due to projection)
    const contracts: Contract[] = contractsResult.map((doc: any) => ({
      contractAddress: doc.contractAddress,
      network: doc.network,
      gasSaved: doc.gasSaved,
      minBidRequired: doc.minBidRequired,
      deployedBy: doc.deployedBy,
      usingUI: doc.usingUI,
      byCLI: doc.byCLI,
      usingAutoCacheFlag: doc.usingAutoCacheFlag,
      txHash: doc.txHash,
      evictionThresholdDate: doc.evictionThresholdDate,
      bidPlacedAt: doc.bidPlacedAt,
    }));

    // Process stats with proper typing
    const statsData = statsResult[0] as Stats | undefined;
    const aggregatedStats: Stats = statsData || {
      totalGasSaved: 0,
      totalContracts: totalCount,
      avgMinBid: 0,
      uniqueDeployers: 0,
      networks: networksResult,
    };

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    
    const endTime = performance.now();
    const responseTime = (endTime - startTime).toFixed(2);
    
    // Performance monitoring
    console.log(`⚡ Dashboard API: ${responseTime}ms`);
    
    // Determine cache duration based on data freshness needs
    const cacheMaxAge = network === "all" ? 60 : 30; // 1 min for all, 30 sec for specific network
    const staleWhileRevalidate = cacheMaxAge;

    // Return response with proper HTTP caching headers
    return NextResponse.json({
      success: true,
      data: contracts,
      stats: aggregatedStats,
      networks: networksResult,
      pagination: {
        total: totalCount,
        limit,
        page,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    }, {
      headers: {
        // HTTP caching for browsers and CDNs
        'Cache-Control': `public, max-age=${cacheMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        // Response metadata
        'X-Response-Time': `${responseTime}ms`,
        'X-Total-Count': totalCount.toString(),
        // CORS and content type optimization
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : "Database error",
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache errors
        }
      }
    );
  }
}