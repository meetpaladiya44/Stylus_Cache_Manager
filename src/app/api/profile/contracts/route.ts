import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export interface Contract {
  _id: string;
  contractAddress: string;
  deployedBy: string;
  network: string;
  deployedAt: string;
  minBidRequired: string;
  gasSaved: string;
  gasUsed: string;
  evictionThresholdDate: string;
  byCLI: boolean;
  txHash: string;
  metadata: {
    version: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('smartcache');
    const contractsCollection = db.collection('contracts');
    const balanceDepositsCollection = db.collection('balance_deposits');

    // Filter contracts by deployedBy field matching the wallet address
    const contracts = await contractsCollection
      .find({ 
        deployedBy: { $regex: new RegExp(walletAddress, 'i') },
        txHash: { $exists: true, $ne: null },
        evictionThresholdDate: { $exists: true, $ne: null }
      })
      .sort({ deployedAt: -1 })
      .toArray();

    // Fetch balance deposits for the user
    const balanceDeposits = await balanceDepositsCollection
      .find({ 
        userWalletAddress: { $regex: new RegExp(walletAddress, 'i') }
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Transform the data to include string _id
    const transformedContracts = contracts.map(contract => ({
      ...contract,
      _id: contract._id.toString()
    }));

    const transformedBalanceDeposits = balanceDeposits.map(deposit => ({
      ...deposit,
      _id: deposit._id.toString()
    }));

    return NextResponse.json({
      success: true,
      contracts: transformedContracts,
      balanceDeposits: transformedBalanceDeposits,
      count: transformedContracts.length
    });

  } catch (error) {
    console.error('Error fetching user contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}