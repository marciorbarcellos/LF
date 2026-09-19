import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

async function checarConexao() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { ok: true, db: db.databaseName };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export default async function Home() {
  const status = await checarConexao();

  return (
    <main>
      <h1>Lotofácil — Gerador de Jogos</h1>
      <p style={{ color: "var(--cor-texto-secundario)" }}>
        Esqueleto inicial do app: Next.js conectado ao MongoDB Atlas.
      </p>

      <div className="card">
        <h2>Status do banco de dados</h2>
        {status.ok ? (
          <span className="status-badge status-ok">
            Conectado ao banco &quot;{status.db}&quot;
          </span>
        ) : (
          <span className="status-badge status-fail">Falha na conexão: {status.error}</span>
        )}
      </div>

      <div className="card">
        <h2>Exemplo de dezenas</h2>
        {[1, 5, 9, 12, 15].map((n) => (
          <span key={n} className="dezena">
            {String(n).padStart(2, "0")}
          </span>
        ))}
      </div>
    </main>
  );
}
