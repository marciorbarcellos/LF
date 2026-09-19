const BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx",
};

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

async function buscar(url) {
  const res = await fetch(url, { cache: "no-store", headers: HEADERS });
  if (!res.ok) {
    const corpo = await res.text().catch(() => "");
    throw new Error(`API da Caixa retornou ${res.status}${corpo ? `: ${corpo.slice(0, 200)}` : ""}`);
  }
  return normalizar(await res.json());
}

export async function buscarUltimoConcurso() {
  return buscar(BASE_URL);
}

export async function buscarConcurso(numero) {
  return buscar(`${BASE_URL}/${numero}`);
}
