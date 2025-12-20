import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anikettegginamath_db_user:uBGnqh11sgfP7DFm@cluster0.zdtxuoa.mongodb.net/?appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'cyberdravida';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongo;

if (!cached) {
    cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = MongoClient.connect(MONGODB_URI).then((client) => {
            return {
                client,
                db: client.db(MONGODB_DB),
            };
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// Helper function to get a collection
export async function getCollection(collectionName) {
    const { db } = await connectToDatabase();
    return db.collection(collectionName);
}
