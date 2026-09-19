// Fonte primária: SORTEIO/sorteios.json no GitHub, sincronizado localmente
// via `npm run sync-sorteios` (a API da Caixa bloqueia IPs de datacenter,
// então não funciona chamada direta a partir da Vercel). O GitHub raw não é
// bloqueado, então lemos de lá. Como fallback oportunista (caso o bloqueio
// da Caixa mude, ou para um concurso ainda não sincronizado), tentamos as
// APIs ao vivo também.

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/marciorbarcellos/LF/main/SORTEIO/sorteios.json";

const FONTES_AO_VIVO = [
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

async function buscarListaGithub() {
  const res = await fetch(GITHUB_RAW_URL, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`GitHub retornou ${res.status}`);
  return res.json();
}

async function buscarUrlAoVivo(url) {
  const res = await fetch(url, { cache: "no-store", headers: HEADERS });
  if (!res.ok) throw new Error(`respondeu ${res.status}`);
  return normalizar(await res.json());
}

async function buscarAoVivoComFallback(escolherUrl) {
  const erros = [];
  for (const fonte of FONTES_AO_VIVO) {
    try {
      return await buscarUrlAoVivo(escolherUrl(fonte));
    } catch (error) {
      erros.push(`${fonte.nome}: ${error.message}`);
    }
  }
  throw new Error(`Fontes ao vivo indisponíveis. Tentativas: ${erros.join(" | ")}`);
}

export async function buscarUltimoConcurso() {
  try {
    const lista = await buscarListaGithub();
    if (lista.length > 0) {
      return lista.reduce((maior, s) => (s.numero > maior.numero ? s : maior), lista[0]);
    }
  } catch {
    // ignora e cai para as fontes ao vivo
  }
  return buscarAoVivoComFallback((fonte) => fonte.urlUltimo);
}

export async function buscarConcurso(numero) {
  try {
    const lista = await buscarListaGithub();
    const achado = lista.find((s) => s.numero === numero);
    if (achado) return achado;
  } catch {
    // ignora e cai para as fontes ao vivo
  }
  return buscarAoVivoComFallback((fonte) => fonte.urlPorNumero(numero));
}
