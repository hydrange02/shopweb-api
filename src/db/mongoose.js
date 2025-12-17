const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "shoply";

let isConnected = false;

async function connectMongo() {
  if (isConnected) return mongoose.connection;
  const conn = await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
  });
  isConnected = true;
  return conn.connection;
}

function bindMongoLogs() {
  const conn = mongoose.connection;
  conn.on("connected", () => console.log(`✔ Mongo connected: ${uri}/${dbName}`));
  conn.on("error", (err) => console.error("✖ Mongo error:", err.message));
  conn.on("disconnected", () => console.warn("⚠ Mongo disconnected"));
}

module.exports = { connectMongo, bindMongoLogs };