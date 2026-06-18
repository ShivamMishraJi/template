import { Db, MongoClient } from "mongodb";

const options = {
  serverSelectionTimeoutMS: 8_000,
};

function requireUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('Missing environment variable MONGODB_URI (e.g. mongodb://127.0.0.1:27017)');
  }
  return uri;
}

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let productionClient: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!globalThis.__mongoClientPromise) {
      globalThis.__mongoClientPromise = new MongoClient(requireUri(), options).connect();
    }
    return globalThis.__mongoClientPromise;
  }
  if (!productionClient) {
    productionClient = new MongoClient(requireUri(), options).connect();
  }
  return productionClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME?.trim() || "template";
  return client.db(dbName);
}
