require('dotenv').config(); 
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("client successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

async function disconnectFromMongoDB() {
  await client.close();
  console.log("client succesfully disconnected from MongoDB")
}

module.exports = {
    client,
    connectToMongoDB, 
    disconnectFromMongoDB
}
