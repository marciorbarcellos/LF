const FONTES = [
  {
    nome: "caixa-oficial",
    urlUltimo: "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil",
    urlPorNumero: (numero) => `https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/${numero}`,
  },
  {
    nome: "espelho-guidi",
    urlUltimo: "https://api.guidi.dev.br/loteria/lotofacil/ultimo",
    urlPorNumero: (numero) => `https://api.guidi.dev.br/loteria/lotofacil/${numero}`,
  },
];

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

async function buscarUrl(url) {
  const res = await fetch(url, { cache: "no-store", headers: HEADERS });
  if (!res.ok) {
    throw new Error(`respondeu ${res.status}`);
  }
  return normalizar(await res.json());
}

// A API oficial da Caixa bloqueia com 403 requisições vindas de IPs de
// datacenter (caso comum de funções serverless na Vercel). Por isso,
// tentamos a fonte oficial primeiro e caímos para um espelho público
// como contingência, mantendo o mesmo formato de resposta.
async function buscarComFallback(escolherUrl) {
  const erros = [];
  for (const fonte of FONTES) {
    try {
      return await buscarUrl(escolherUrl(fonte));
    } catch (error) {
      erros.push(`${fonte.nome}: ${error.message}`);
    }
  }
  throw new Error(`Não foi possível obter dados da Lotofácil. Tentativas: ${erros.join(" | ")}`);
}

export async function buscarUltimoConcurso() {
  return buscarComFallback((fonte) => fonte.urlUltimo);
}

export async function buscarConcurso(numero) {
  return buscarComFallback((fonte) => fonte.urlPorNumero(numero));
}
