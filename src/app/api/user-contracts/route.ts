import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '../../../lib/mongodb';

interface ContractData {
  _id: string;
  contractAddress: string;
  deployedBy: string;
  network: string;
  minBidRequired: string;
  gasSaved: string;
  gasUsed: string;
  deployedAt: string;
  evictionThresholdDate: string;
  usingAutoCacheFlag: boolean;
  txHash: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const network = searchParams.get('network') || 'arbitrum-sepolia';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await getMongoClient();
    const db = client.db('cache-manager'); // Adjust database name as needed
    const collection = db.collection('contracts'); // Adjust collection name as needed

    // Fetch contracts where deployedBy matches the wallet address
    const contracts = await collection
      .find({
        deployedBy: walletAddress.toLowerCase(),
        network: network
      })
      .sort({ deployedAt: -1 }) // Sort by deployment date, newest first
      .toArray();

    // Transform the data to match the expected format
    const transformedContracts: ContractData[] = contracts.map((contract: any) => ({
      _id: contract._id.toString(),
      contractAddress: contract.contractAddress,
      deployedBy: contract.deployedBy,
      network: contract.network,
      minBidRequired: contract.minBidRequired,
      gasSaved: contract.gasSaved,
      gasUsed: contract.gasUsed,
      deployedAt: contract.deployedAt,
      evictionThresholdDate: contract.evictionThresholdDate,
      usingAutoCacheFlag: contract.usingAutoCacheFlag,
      txHash: contract.txHash
    }));

    return NextResponse.json({
      success: true,
      data: transformedContracts,
      count: transformedContracts.length
    });

  } catch (error) {
    console.error('Error fetching user contracts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user contracts',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
} 