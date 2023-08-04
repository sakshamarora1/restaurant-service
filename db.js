const { MongoClient, ObjectId } = require('mongodb')

const mongoURI = 'mongodb://localhost:27017/restaurant'
let db

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(mongoURI, { useUnifiedTopology: true })
    db = client.db()
    console.log('Connected to MongoDB database.')
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    throw error
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database connection not established.')
  }
  return db
}

module.exports = {
  connectToDatabase,
  getDb,
  ObjectId
}
