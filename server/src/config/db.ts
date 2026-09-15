import mongoose from 'mongoose'

export async function connectDb(uri?: string): Promise<void> {
  const mongoUri = uri ?? process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/geofix'
  mongoose.set('strictQuery', true)
  await mongoose.connect(mongoUri)
  const sanitizedUri = mongoUri.replace(/\/\/(.*):(.*)@/, '//***:***@')
  console.log(`[db] connected to MongoDB: ${sanitizedUri}`)
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect()
  console.log('[db] disconnected from MongoDB')
}