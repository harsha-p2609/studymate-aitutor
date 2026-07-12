// ============================================================
// config/db.js
// Handles MongoDB connection using Mongoose
// ============================================================

const mongoose = require("mongoose");
const dns = require("dns");

/**
 * Connects to MongoDB using the URI from environment variables.
 * Automatically resolves DNS SRV records using custom DNS servers
 * and falls back to a local MongoDB server if connection fails.
 */
const connectDB = async () => {
  // Set custom DNS servers to handle Atlas SRV record lookup issues on Windows
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    console.log("📡 Configured custom DNS servers (8.8.8.8, 1.1.1.1) for Mongoose");
  } catch (dnsErr) {
    console.warn("⚠️ Warning: Failed to set custom DNS servers:", dnsErr.message);
  }

  const primaryURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studymate_ai";
  const fallbackURI = "mongodb://127.0.0.1:27017/studymate_ai";

  try {
    // Mask password in logs
    const maskedURI = primaryURI.replace(/:([^:@]+)@/, ":******@");
    console.log(`🔌 Connecting to primary database: ${maskedURI}`);
    
    const connection = await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 5000, // Time out after 5 seconds instead of hanging
    });
    console.log(`✅ MongoDB Connected (Primary): ${connection.connection.host}`);
    
    // Drop unique index on studyplans if it exists to allow multiple plans per user
    try {
      await mongoose.connection.db.collection("studyplans").dropIndex("userId_1");
      console.log("✅ Successfully dropped unique userId index from studyplans collection");
    } catch (indexErr) {
      // Index might not exist, which is fine
    }
  } catch (error) {
    console.error(`❌ MongoDB Primary Connection Error: ${error.message}`);
    
    // Only attempt fallback if the primary URI is different from the fallback URI
    if (primaryURI !== fallbackURI) {
      try {
        console.log(`🔌 Attempting fallback connection to local database: ${fallbackURI}`);
        const connection = await mongoose.connect(fallbackURI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected (Fallback): ${connection.connection.host}`);
        
        // Drop unique index on studyplans if it exists to allow multiple plans per user
        try {
          await mongoose.connection.db.collection("studyplans").dropIndex("userId_1");
          console.log("✅ Successfully dropped unique userId index from studyplans collection");
        } catch (indexErr) {
          // Index might not exist, which is fine
        }
      } catch (fallbackError) {
        console.error(`❌ MongoDB Fallback Connection Error: ${fallbackError.message}`);
        process.exit(1); // Exit process with failure
      }
    } else {
      process.exit(1); // Exit process with failure
    }
  }
};

module.exports = connectDB;

