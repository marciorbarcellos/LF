import { NextResponse } from "next/server";

const REPO = "marciorbarcellos/LF";
const WORKFLOW = "sync-sorteios.yml";

// A Vercel não consegue consultar a Caixa (bloqueio de IP), então a atualização
// é feita disparando o workflow do GitHub Actions, que busca o resultado,
// commita o sorteios.json e o app lê o arquivo atualizado.
export async function POST() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Atualização manual não configurada (variável GITHUB_DISPATCH_TOKEN ausente)." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Não foi possível iniciar a atualização (GitHub respondeu ${res.status}).` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
