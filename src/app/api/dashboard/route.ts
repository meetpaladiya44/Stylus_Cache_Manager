import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

interface Contract {
  _id?: string;
  contractAddress: string;
  network: string;
  gasSaved: number;
  minBidRequired: number;
  deployedBy: string;
  usingUI?: boolean;
  byCLI?: boolean;
  usingAutoCacheFlag?: boolean;
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
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<LeaderboardResponse>> {
  try {
    const client = await getMongoClient();
    const db = client.db("smartcache");
    const collection = db.collection<Contract>("contracts");

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network") || "all";
    const sortBy = searchParams.get("sortBy") || "gasSaved";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query filter
    const query: { network?: string } = {};
    if (network !== "all") {
      query.network = network;
    }

    // Build sort object
    let sortObj: { [key: string]: 1 | -1 } = {};
    if (sortBy === "gasSaved") {
      sortObj.gasSaved = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "minBidRequired") {
      sortObj.minBidRequired = sortOrder === "desc" ? -1 : 1;
    } else {
      sortObj.gasSaved = -1; // Default sort by gas saved descending
    }

    // Execute query with sorting and limit
    const contracts = await collection
      .find(query)
      .sort(sortObj)
      .limit(limit)
      .toArray();

    // Get total count for pagination (without limit)
    const totalCount = await collection.countDocuments(query);

    // Calculate aggregated stats based on the current filter
    const statsAggregation = [
      ...(network !== "all" ? [{ $match: { network } }] : []),
      {
        $group: {
          _id: null,
          totalGasSaved: { $sum: { $toInt: "$gasSaved" } },
          totalContracts: { $sum: 1 },
          avgMinBid: { $avg: { $toDouble: "$minBidRequired" } },
          uniqueDeployers: { $addToSet: "$deployedBy" },
          networks: { $addToSet: "$network" },
        },
      },
      {
        $addFields: {
          uniqueDeployers: { $size: "$uniqueDeployers" }
        }
      }
    ];

    const stats = await collection.aggregate<Stats>(statsAggregation).toArray();

    const aggregatedStats: Stats = stats[0] || {
      totalGasSaved: 0,
      totalContracts: 0,
      avgMinBid: 0,
      uniqueDeployers: 0,
      networks: [],
    };

    // Get all available networks (this should always show all networks regardless of filter)
    const allNetworks = await collection.distinct("network");

    return NextResponse.json({
      success: true,
      data: contracts,
      stats: aggregatedStats,
      networks: allNetworks,
      pagination: {
        total: totalCount,
        limit,
        hasMore: totalCount > limit,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Database error",
      },
      { status: 500 }
    );
  }
}
