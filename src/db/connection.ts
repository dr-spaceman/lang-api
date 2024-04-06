import { MongoClient, Db } from 'mongodb'
import getEnv from '../utils/get-env'

const DB: string = getEnv('MONGODB_DB')
const URL: string = getEnv('MONGODB_URL')

let db: Db | null = null

async function connectDB(): Promise<Db> {
  if (db) {
    return db
  }

  try {
    const client: MongoClient = new MongoClient(URL)
    const conn = await client.connect()
    db = conn.db(DB)
    return db
  } catch (e) {
    console.error(e)
    throw e
  }
}

// Exports a function that ensures the DB is connected and returns the connection
export async function getDb(): Promise<Db> {
  if (!db) {
    await connectDB()
  }
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}
