import { getDb } from './connection'

export type Counter = {
  _id: string
  current: number
}

/**
 * Increment counter and get update count
 * Used for generating unique IDs for a document
 */
async function getNextSequence(collectionName: string) {
  const db = await getDb()
  const result = await db
    .collection<Counter>('counters')
    .findOneAndUpdate(
      { _id: collectionName },
      { $inc: { current: 1 } },
      { upsert: true, returnDocument: 'after' }
    )

  if (!result || !result?.current) {
    throw new Error(`Could not get next sequence for ${collectionName}`)
  }

  return result.current
}

export { getDb, getNextSequence }
