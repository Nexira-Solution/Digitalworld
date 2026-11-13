import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global connection cache across Next.js dev server hot-reloads
 */
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  // If already connected and ready, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    const errorMsg = 'Missing MONGODB_URI in environment variables. Please check your .env file.';
    console.error(`[MongoDB] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging 30s+
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('[MongoDB] Connected to MongoDB Atlas successfully.');
        return m;
      })
      .catch((err) => {
        // Clear cached promise on rejection so subsequent requests can retry
        cached.promise = null;
        cached.conn = null;

        if (err.name === 'MongooseServerSelectionError') {
          console.error(
            '\n' +
            '========================================================================\n' +
            '❌ [MongoDB Atlas Error] MongooseServerSelectionError\n' +
            'Could not connect to any servers in your MongoDB Atlas cluster.\n\n' +
            '👉 Common Root Cause: IP Whitelist Issue\n' +
            '   Your current IP address is not whitelisted in MongoDB Atlas.\n\n' +
            '👉 How to Fix in MongoDB Atlas:\n' +
            '   1. Open https://cloud.mongodb.com and log in.\n' +
            '   2. In the left sidebar, click "Network Access" under "Security".\n' +
            '   3. Click the "+ ADD IP ADDRESS" button.\n' +
            '   4. Choose "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) or click "ADD CURRENT IP ADDRESS".\n' +
            '   5. Click "Confirm" and wait ~1 minute for Atlas to apply changes.\n' +
            '========================================================================\n'
          );
        } else {
          console.error('[MongoDB] Connection error:', err.message);
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}
