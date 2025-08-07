import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export interface BalanceDepositData {
  userWalletAddress: string;
  txHash: string;
  network: string;
  minBalanceValue: string;
  timestamp: string;
  dynamicUpdatedBalVal: string;
  totalGasCost: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API received data:', body);
    
    // Minimal validation: check required fields are present
    const {
      userWalletAddress,
      txHash,
      network,
      minBalanceValue,
      timestamp,
      dynamicUpdatedBalVal,
      totalGasCost
    }: BalanceDepositData = body;

    if (!userWalletAddress || !txHash || !network || !minBalanceValue || !timestamp || !dynamicUpdatedBalVal || !totalGasCost) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('smartcache');
    const collection = db.collection('balance_deposits');

    // Check if transaction hash already exists to prevent duplicates
    const existingTransaction = await collection.findOne({ txHash });
    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction already recorded' },
        { status: 409 }
      );
    }

    // Check if user already has a record for this network
    const existingUserRecord = await collection.findOne({
      userWalletAddress: { $regex: new RegExp(userWalletAddress, 'i') },
      network: network
    });

    if (existingUserRecord) {
      // Update existing record - accumulate balance values, override transaction values
      const currentMinBalance = parseFloat(existingUserRecord.minBalanceValue);
      const currentDynamicBalance = parseFloat(existingUserRecord.dynamicUpdatedBalVal);
      const newMinBalance = currentMinBalance + parseFloat(minBalanceValue);
      const newDynamicBalance = currentDynamicBalance + parseFloat(dynamicUpdatedBalVal);

      const updateResult = await collection.updateOne(
        { 
          userWalletAddress: { $regex: new RegExp(userWalletAddress, 'i') },
          network: network
        },
        {
          $set: {
            txHash,
            timestamp: new Date(timestamp),
            updatedAt: new Date(),
            totalGasCost,
            minBalanceValue: newMinBalance.toString(),
            dynamicUpdatedBalVal: newDynamicBalance.toString()
          }
        }
      );

      console.log('Balance deposit record updated:', {
        id: existingUserRecord._id,
        userWalletAddress,
        txHash,
        network,
        newMinBalance: newMinBalance.toString(),
        newDynamicBalance: newDynamicBalance.toString()
      });

      return NextResponse.json({
        success: true,
        message: 'Balance deposit updated successfully',
        data: {
          id: existingUserRecord._id,
          userWalletAddress,
          txHash,
          network,
          minBalanceValue: newMinBalance.toString(),
          dynamicUpdatedBalVal: newDynamicBalance.toString(),
          timestamp
        }
      });
    } else {
      // Create new record for this user+network combination
      const depositRecord = {
        userWalletAddress: userWalletAddress.toLowerCase(), // Store in lowercase for consistency
        txHash,
        network,
        minBalanceValue,
        timestamp: new Date(timestamp), // Convert to Date object
        dynamicUpdatedBalVal,
        totalGasCost,
        updatedAt: new Date()
      };

      // Insert the record
      const result = await collection.insertOne(depositRecord);

      console.log('Balance deposit record created:', {
        id: result.insertedId,
        userWalletAddress,
        txHash,
        network,
        minBalanceValue
      });

      return NextResponse.json({
        success: true,
        message: 'Balance deposit recorded successfully',
        data: {
          id: result.insertedId,
          userWalletAddress,
          txHash,
          network,
          minBalanceValue,
          timestamp
        }
      });
    }

  } catch (error) {
    console.error('Error recording balance deposit:', error);
    
    // Handle MongoDB connection errors
    if (error instanceof Error && error.message.includes('MongoClient')) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record balance deposit' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve balance deposits for a user
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

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('smartcache');
    const collection = db.collection('balance_deposits');

    // Get all deposits for the wallet address, sorted by timestamp (newest first)
    const deposits = await collection
      .find({ userWalletAddress: { $regex: new RegExp(walletAddress, 'i') } })
      .sort({ timestamp: -1 })
      .toArray();

    // Transform the data to include string _id
    const transformedDeposits = deposits.map(deposit => ({
      ...deposit,
      _id: deposit._id.toString()
    }));

    return NextResponse.json({
      success: true,
      deposits: transformedDeposits,
      count: transformedDeposits.length
    });

  } catch (error) {
    console.error('Error fetching balance deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance deposits' },
      { status: 500 }
    );
  }
}