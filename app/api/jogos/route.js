import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { gerarDezenas } from "@/lib/gerarJogo";
import { buscarUltimoConcurso, buscarConcurso } from "@/lib/caixa";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const quantidade = Number(body.quantidade) || 15;
    const quantidadeJogos = Math.min(Math.max(Number(body.quantidadeJogos) || 1, 1), 100);

    if (quantidade < 15 || quantidade > 20) {
      return NextResponse.json({ ok: false, error: "Quantidade de dezenas deve ser entre 15 e 20." }, { status: 400 });
    }

    // A geração do jogo não depende dos dados de concurso — só a conferência
    // posterior depende. Se a fonte de resultados estiver indisponível, o
    // jogo ainda é gerado e salvo, só fica marcado como "concurso a confirmar".
    let concursoAlvo = null;
    try {
      const ultimo = await buscarUltimoConcurso();
      concursoAlvo = ultimo.numeroConcursoProximo;
    } catch {
      concursoAlvo = null;
    }

    const loteId = randomUUID();
    const criadoEm = new Date();
    const docs = Array.from({ length: quantidadeJogos }, () => ({
      concursoAlvo,
      dezenas: gerarDezenas(quantidade),
      loteId,
      criadoEm,
    }));

    const db = await getDb();
    const { insertedIds } = await db.collection("jogosGerados").insertMany(docs);
    const jogos = docs.map((doc, i) => ({ _id: insertedIds[i], ...doc }));

    return NextResponse.json({ ok: true, jogos });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const idsBrutos = Array.isArray(body.ids) ? body.ids : [];

    let ids;
    try {
      ids = idsBrutos.map((id) => new ObjectId(id));
    } catch {
      return NextResponse.json({ ok: false, error: "ID de jogo inválido." }, { status: 400 });
    }

    if (ids.length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum jogo selecionado." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("conferencias").deleteMany({ jogoId: { $in: ids } });
    const { deletedCount } = await db.collection("jogosGerados").deleteMany({ _id: { $in: ids } });

    return NextResponse.json({ ok: true, removidos: deletedCount });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const pageSize = Math.min(Math.max(Number(params.get("pageSize")) || 100, 1), 100);
    const page = Math.max(Number(params.get("page")) || 1, 1);

    const db = await getDb();
    const total = await db.collection("jogosGerados").countDocuments({});
    const totalPaginas = Math.max(Math.ceil(total / pageSize), 1);
    const jogos = await db
      .collection("jogosGerados")
      .find({})
      .sort({ criadoEm: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    const paginacao = { page, pageSize, total, totalPaginas };

    let ultimo = null;
    try {
      ultimo = await buscarUltimoConcurso();
    } catch {
      ultimo = null;
    }

    if (!ultimo) {
      return NextResponse.json({
        ok: true,
        ultimoConcurso: null,
        avisoFonteDados: "Fonte de resultados indisponível no momento — conferência temporariamente desativada.",
        jogos: jogos.map((jogo) => ({ ...jogo, conferencia: null })),
        paginacao,
      });
    }

    const cacheConcursos = new Map([[ultimo.numero, ultimo]]);

    const jogosComConferencia = await Promise.all(
      jogos.map(async (jogo) => {
        const jaSorteado = jogo.concursoAlvo && jogo.concursoAlvo <= ultimo.numero;
        if (!jaSorteado) {
          return { ...jogo, conferencia: null };
        }

        const cacheado = await db.collection("conferencias").findOne({ jogoId: jogo._id });
        if (cacheado) {
          return { ...jogo, conferencia: cacheado };
        }

        let sorteio = cacheConcursos.get(jogo.concursoAlvo);
        if (!sorteio) {
          try {
            sorteio = await buscarConcurso(jogo.concursoAlvo);
            cacheConcursos.set(jogo.concursoAlvo, sorteio);
          } catch {
            return { ...jogo, conferencia: null };
          }
        }

        const dezenasAcertadas = jogo.dezenas.filter((d) => sorteio.dezenas.includes(d));
        const dezenasErradas = jogo.dezenas.filter((d) => !sorteio.dezenas.includes(d));

        const conferencia = {
          jogoId: jogo._id,
          concurso: jogo.concursoAlvo,
          acertos: dezenasAcertadas.length,
          erros: dezenasErradas.length,
          dezenasAcertadas,
          dezenasErradas,
          calculadoEm: new Date(),
        };

        await db
          .collection("conferencias")
          .updateOne({ jogoId: jogo._id }, { $set: conferencia }, { upsert: true });

        return { ...jogo, conferencia };
      })
    );

    return NextResponse.json({ ok: true, ultimoConcurso: ultimo, jogos: jogosComConferencia, paginacao });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
