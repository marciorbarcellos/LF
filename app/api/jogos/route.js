import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { gerarDezenas } from "@/lib/gerarJogo";
import { buscarUltimoConcurso, buscarConcurso } from "@/lib/caixa";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const quantidade = Number(body.quantidade) || 15;

    if (quantidade < 15 || quantidade > 20) {
      return NextResponse.json({ ok: false, error: "Quantidade deve ser entre 15 e 20." }, { status: 400 });
    }

    const ultimo = await buscarUltimoConcurso();
    const dezenas = gerarDezenas(quantidade);

    const db = await getDb();
    const doc = {
      concursoAlvo: ultimo.numeroConcursoProximo,
      dezenas,
      criadoEm: new Date(),
    };
    const { insertedId } = await db.collection("jogosGerados").insertOne(doc);

    return NextResponse.json({ ok: true, jogo: { _id: insertedId, ...doc } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit")) || 20;

    const db = await getDb();
    const jogos = await db
      .collection("jogosGerados")
      .find({})
      .sort({ criadoEm: -1 })
      .limit(limit)
      .toArray();

    const ultimo = await buscarUltimoConcurso();
    const cacheConcursos = new Map([[ultimo.numero, ultimo]]);

    const jogosComConferencia = await Promise.all(
      jogos.map(async (jogo) => {
        const jaSorteado = jogo.concursoAlvo <= ultimo.numero;
        if (!jaSorteado) {
          return { ...jogo, conferencia: null };
        }

        const cacheado = await db.collection("conferencias").findOne({ jogoId: jogo._id });
        if (cacheado) {
          return { ...jogo, conferencia: cacheado };
        }

        let sorteio = cacheConcursos.get(jogo.concursoAlvo);
        if (!sorteio) {
          sorteio = await buscarConcurso(jogo.concursoAlvo);
          cacheConcursos.set(jogo.concursoAlvo, sorteio);
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

    return NextResponse.json({ ok: true, ultimoConcurso: ultimo, jogos: jogosComConferencia });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
