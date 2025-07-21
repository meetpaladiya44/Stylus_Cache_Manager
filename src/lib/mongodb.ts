import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI as string
if (!uri) throw new Error('Please add your Mongo URI to .env.local')

let client: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
  if (client && (client as any).isConnected && (client as any).isConnected()) return client
  client = new MongoClient(uri)
  await client.connect()
  return client
} 