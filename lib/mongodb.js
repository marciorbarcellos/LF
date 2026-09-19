import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Defina a variável de ambiente MONGODB_URI (.env.local ou nas Environment Variables da Vercel).");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Em dev, reaproveita a conexão entre hot-reloads usando um global.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DB || "lotofacil");
}
