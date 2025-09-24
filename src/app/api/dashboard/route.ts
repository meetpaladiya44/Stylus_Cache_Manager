import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

// Disable any Next.js caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  network: 'network',
  deployedVia: 'deployedVia'
};

// ✅ FIXED: Build optimized sort object with special handling for deployedVia
const buildSortObject = (sortBy: string, sortOrder: string): { [key: string]: 1 | -1 } => {
  const field = SORT_MAPPING[sortBy] || 'gasSaved';
  const order = sortOrder === 'asc' ? 1 : -1;
  
  // Special handling for deployedVia - create a computed sort field
  if (sortBy === 'deployedVia') {
    // MongoDB will sort by this computed field: Web UI < CLI Tool < Rust Crate
    return { 
      deployedViaSort: order,
      gasSaved: -1 // Secondary sort by gas saved for consistency
    };
  }
  
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

    // ✅ PERFORMANCE: Connect to database with optimized settings
    const client = await getMongoClient();
    const db = client.db("smartcache");
    const collection = db.collection("contracts");

    // ✅ PERFORMANCE: Ensure critical indexes exist for optimal query performance
    try {
      await Promise.all([
        collection.createIndex({ gasSaved: -1 }),
        collection.createIndex({ network: 1, gasSaved: -1 }),
        collection.createIndex({ minBidRequired: 1 }),
        collection.createIndex({ usingUI: 1, byCLI: 1, usingAutoCacheFlag: 1 }) // For deployedVia sorting
      ]);
    } catch (indexError) {
      // Indexes might already exist, continue silently
      console.log('⚠️ Index creation skipped (may already exist)');
    }

    // Build query filter and sort
    const matchStage = network !== "all" ? { network } : {};
    const sortObj = buildSortObject(sortBy, sortOrder);

    // ✅ SIMPLIFIED: Handle deployedVia sorting with aggregation, others with standard sorting
    let contractsQuery;
    
    if (sortBy === 'deployedVia') {
      // Handle deployedVia with MongoDB aggregation
      contractsQuery = collection.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $addFields: {
            deployedViaSort: {
              $cond: {
                if: "$usingUI", then: 1,
                else: {
                  $cond: {
                    if: "$byCLI", then: 2,
                    else: {
                      $cond: {
                        if: "$usingAutoCacheFlag", then: 3,
                        else: 4 // Unknown
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $sort: { deployedViaSort: sortOrder === 'asc' ? 1 : -1, gasSaved: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: CONTRACT_PROJECTION }
      ]).toArray();
    } else {
      // Standard sorting for gasSaved, minBidRequired, network
      contractsQuery = collection
        .find(matchStage, { projection: CONTRACT_PROJECTION })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray();
    }

    // Execute all queries in parallel for optimal performance
    const [contractsResult, statsResult, networksResult, totalCount] = await Promise.all([
      // Query 1: Get paginated contracts with sorting (now supports deployedVia)
      contractsQuery,

      // Query 2: Get aggregated stats
      collection
        .aggregate(buildStatsAggregation(matchStage))
        .toArray(),

      // Query 3: Get all available networks
      collection.distinct("network"),

      // Query 4: Get total count for pagination
      collection.countDocuments(matchStage)
    ]);

    // ✅ SIMPLIFIED: Process contracts (data comes pre-sorted from MongoDB)
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
    
    // Performance monitoring and alerting
    if (parseFloat(responseTime) > 1000) {
      console.warn(`⚠️ Slow API response: ${responseTime}ms for ${sortBy}-${sortOrder}-page${page}`);
    }

    // Return response with strict no-cache headers (client handles caching)
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
        // Strictly disable caching at HTTP level
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Response metadata for debugging
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