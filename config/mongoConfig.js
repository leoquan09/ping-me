require('dotenv').config(); 
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
let dbInstance = null;

async function connectToMongoDB() {
  try {
    if (dbInstance) return dbInstance;

    await client.connect();
    console.log("Client successfully connected to MongoDB!");
    
    dbInstance = client.db('chatApp'); 
    return dbInstance;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

function getDb() {
  if (!dbInstance) {
    throw new Error("Must run and await connectToMongoDB() before calling getDb()");
  }
  return dbInstance;
}

async function disconnectFromMongoDB() {
  if (client) {
    await client.close();
    dbInstance = null;
    console.log("Client successfully disconnected from MongoDB");
  }
}

module.exports = {
    connectToMongoDB,
    getDb,
    disconnectFromMongoDB
};
