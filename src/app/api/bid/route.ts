import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contractAddress,
      deployedBy,
      network,
      minBidRequired,
      gasSaved,
      gasUsed,
      txHash
    } = body;

    // Validate required fields
    if (!contractAddress || !deployedBy || !network || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current date in IST
    const now = new Date();
    const istTime = new Date(now.getTime());

    const bidData = {
      contractAddress,
      deployedBy,
      network,
      minBidRequired: minBidRequired || "0.0",
      gasSaved: gasSaved || "0",
      gasUsed: gasUsed || "0",
      bidPlacedAt: istTime.toISOString(),
      usingUI: true,
      txHash
    };

    // Connect to MongoDB
    const client = await clientPromise;
    const collection = client.db("smartcache").collection("contracts");

    // Insert the bid data
    const result = await collection.insertOne(bidData);

    console.log('Bid data stored successfully:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'Bid data stored successfully',
      id: result.insertedId
    });

  } catch (error) {
    console.error('Error storing bid data:', error);
    return NextResponse.json(
      { error: 'Failed to store bid data' },
      { status: 500 }
    );
  }
} 