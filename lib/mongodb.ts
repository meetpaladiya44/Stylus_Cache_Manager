// lib/mongodb.ts
import { MongoClient } from 'mongodb';
import { DashboardData } from '../types';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Database helper functions
export async function getUserDashboardData(walletAddress: string): Promise<DashboardData | null> {
  try {
    const client = await clientPromise;
    const collection = client.db("dashboard").collection("userMetrics");
    
    const userData = await collection.findOne({ walletAddress });
    return userData?.dashboardData || null;
  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    return null;
  }
}

export async function saveUserDashboardData(walletAddress: string, dashboardData: DashboardData): Promise<boolean> {
  try {
    const client = await clientPromise;
    const collection = client.db("dashboard").collection("userMetrics");
    
    await collection.updateOne(
      { walletAddress },
      { 
        $set: { 
          dashboardData,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error saving user dashboard data:', error);
    return false;
  }
}

export default clientPromise;