import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in .env.local');
}

// Global cache to reuse connection across hot-reloads (dev) and serverless invocations (prod)
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                dbName: 'jmd_refrigeration',
                bufferCommands: false,
            })
            .then((m) => m);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;
