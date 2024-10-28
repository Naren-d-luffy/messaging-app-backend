const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

const connectDB = async () => {
  try {
    await client.connect();
    console.log("DB connected")
    return client.db("Messaging");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error; 
  }
};

module.exports = connectDB;
