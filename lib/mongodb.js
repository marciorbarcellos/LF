import dns from "node:dns";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Defina a variável de ambiente MONGODB_URI (.env.local ou nas Environment Variables da Vercel).");
}

// Em alguns ambientes serverless a resolução de DNS prioriza IPv6 para o SRV
// do Atlas e o handshake TLS por esse caminho falha ("SSL alert number 80").
// Forçamos IPv4 só durante a conexão inicial e revertemos em seguida, porque
// outras chamadas (ex.: API da Caixa) podem depender da ordem padrão do host.
async function conectar() {
  const ordemOriginal = dns.getDefaultResultOrder();
  dns.setDefaultResultOrder("ipv4first");
  try {
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  } finally {
    dns.setDefaultResultOrder(ordemOriginal);
  }
}

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Em dev, reaproveita a conexão entre hot-reloads usando um global.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = conectar();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = conectar();
}

export default clientPromise;

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DB || "lotofacil");
}
