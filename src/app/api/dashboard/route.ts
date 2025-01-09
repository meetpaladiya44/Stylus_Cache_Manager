// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserDashboardData, saveUserDashboardData } from '../../../../lib/mongodb';

export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get('x-wallet-address');
  
  if (!walletAddress) {
    // Return default data if no wallet address is provided
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIS_DATA_ENDPOINT}/dashboard-data`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_CALCULATION_API_KEY || '',
      },
    });
    
    const defaultData = await response.json();
    return NextResponse.json(defaultData);
  }

  try {
    // Try to get user-specific data from MongoDB
    const userData = await getUserDashboardData(walletAddress);
    
    if (userData) {
      return NextResponse.json(userData);
    }

    console.log("userData", userData);
    
    // If no user data exists, return default data
    const key = process.env.NEXT_PUBLIC_CALCULATION_API_KEY;
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIS_DATA_ENDPOINT}/dashboard-data`, {
      headers: {
        ...(key && { "x-api-key": key }),
      },
    });
    
    const defaultData = await response.json();
    return NextResponse.json(defaultData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const walletAddress = req.headers.get('x-wallet-address');
  
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { bidAmount } = body;

    // Call the calculation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIS_DATA_ENDPOINT}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_CALCULATION_API_KEY || '',
      },
      body: JSON.stringify({ bidAmount }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI metrics');
    }

    const metrics = await response.json();
    
    // Save the metrics to MongoDB
    await saveUserDashboardData(walletAddress, metrics);

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process calculation' },
      { status: 500 }
    );
  }
}