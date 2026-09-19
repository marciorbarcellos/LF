// Sincroniza os resultados da Lotofácil da API oficial da Caixa para
// SORTEIO/sorteios.json. Rode localmente (a API da Caixa bloqueia IPs de
// datacenter/hosting, então isso não funciona a partir da Vercel/GitHub
// Actions) sempre que quiser atualizar o app com os sorteios mais recentes:
//
//   npm run sync-sorteios
//
// Depois é só commitar e enviar o SORTEIO/sorteios.json atualizado.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil";
const ARQUIVO = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "SORTEIO",
  "sorteios.json"
);

function normalizar(resultado) {
  return {
    numero: resultado.numero,
    dataApuracao: resultado.dataApuracao,
    dezenas: resultado.listaDezenas.map(Number).sort((a, b) => a - b),
    numeroConcursoProximo: resultado.numeroConcursoProximo,
    dataProximoConcurso: resultado.dataProximoConcurso,
    acumulado: resultado.acumulado,
    valorEstimadoProximoConcurso: resultado.valorEstimadoProximoConcurso ?? null,
  };
}

async function buscarConcurso(numero) {
  const url = numero ? `${BASE_URL}/${numero}` : BASE_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API da Caixa retornou ${res.status} para o concurso ${numero ?? "(último)"}`);
  return normalizar(await res.json());
}

async function carregarExistentes() {
  try {
    const conteudo = await readFile(ARQUIVO, "utf8");
    return JSON.parse(conteudo);
  } catch {
    return [];
  }
}

async function main() {
  const existentes = await carregarExistentes();
  const porNumero = new Map(existentes.map((s) => [s.numero, s]));

  const ultimo = await buscarConcurso();
  const maiorNumeroSalvo = existentes.reduce((max, s) => Math.max(max, s.numero), 0);

  // Padrão: sincroniza incrementalmente a partir do último concurso salvo.
  // Use --completo para (re)baixar tudo desde o concurso 1, ou --desde=N.
  const args = process.argv.slice(2);
  const completo = args.includes("--completo");
  const desdeArg = args.find((a) => a.startsWith("--desde="));
  const desde = completo
    ? 1
    : desdeArg
      ? Number(desdeArg.split("=")[1])
      : existentes.length === 0
        ? ultimo.numero
        : maiorNumeroSalvo + 1;

  console.log(`Concurso mais recente: ${ultimo.numero}. Sincronizando a partir de ${desde}...`);

  for (let numero = desde; numero <= ultimo.numero; numero++) {
    if (porNumero.has(numero)) continue;
    process.stdout.write(`  concurso ${numero}... `);
    try {
      const dados = numero === ultimo.numero ? ultimo : await buscarConcurso(numero);
      porNumero.set(numero, dados);
      console.log("ok");
    } catch (error) {
      console.log(`falhou (${error.message})`);
    }
  }

  const lista = Array.from(porNumero.values()).sort((a, b) => a.numero - b.numero);
  await writeFile(ARQUIVO, JSON.stringify(lista, null, 2) + "\n", "utf8");
  console.log(`Salvo ${lista.length} concursos em ${ARQUIVO}`);
}

main().catch((error) => {
  console.error("Falha na sincronização:", error.message);
  process.exit(1);
});
