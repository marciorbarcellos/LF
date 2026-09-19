const BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil";

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

export async function buscarUltimoConcurso() {
  const res = await fetch(BASE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`API da Caixa retornou ${res.status}`);
  return normalizar(await res.json());
}

export async function buscarConcurso(numero) {
  const res = await fetch(`${BASE_URL}/${numero}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API da Caixa retornou ${res.status} para o concurso ${numero}`);
  return normalizar(await res.json());
}
