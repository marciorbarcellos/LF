import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { TOTAL_COMBINACOES, COMBINACOES_COBERTAS_POR_TAMANHO } from "@/lib/cobertura";

export async function GET() {
  try {
    const db = await getDb();
    const colecao = db.collection("jogosGerados");

    // Exato: conta combinações de 15 dezenas DISTINTAS já geradas (a coleção não tem
    // garantia de unicidade no banco ainda, então duas entradas podem ser iguais —
    // por isso agrupamos em vez de só contar documentos).
    const distintos15 = await colecao
      .aggregate([{ $match: { dezenas: { $size: 15 } } }, { $group: { _id: "$dezenas" } }, { $count: "total" }])
      .toArray();
    const combinacoesExatas = distintos15[0]?.total ?? 0;

    // Estimativa: jogos de 16-20 dezenas cobrem várias combinações de 15 cada um,
    // mas sem rastrear quais exatamente — somamos o potencial de cobertura de cada
    // jogo, o que pode contar a mesma combinação mais de uma vez se dois jogos
    // diferentes a cobrirem. É uma estimativa por cima (upper bound), não exata.
    const porTamanho = await colecao
      .aggregate([
        { $match: { $expr: { $gt: [{ $size: "$dezenas" }, 15] } } },
        { $group: { _id: { $size: "$dezenas" }, totalJogos: { $sum: 1 } } },
      ])
      .toArray();

    let combinacoesEstimadas16a20 = 0;
    let jogos16a20 = 0;
    for (const { _id: tamanho, totalJogos } of porTamanho) {
      combinacoesEstimadas16a20 += totalJogos * (COMBINACOES_COBERTAS_POR_TAMANHO[tamanho] ?? 0);
      jogos16a20 += totalJogos;
    }

    const totalEstimado = combinacoesExatas + combinacoesEstimadas16a20;

    return NextResponse.json({
      ok: true,
      totalCombinacoes: TOTAL_COMBINACOES,
      combinacoesExatas,
      combinacoesEstimadas16a20,
      jogos16a20,
      totalEstimado: Math.min(totalEstimado, TOTAL_COMBINACOES),
      percentualExato: (combinacoesExatas / TOTAL_COMBINACOES) * 100,
      percentualComEstimativa: (Math.min(totalEstimado, TOTAL_COMBINACOES) / TOTAL_COMBINACOES) * 100,
      temEstimativa: jogos16a20 > 0,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
