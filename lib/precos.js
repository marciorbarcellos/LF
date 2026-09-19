// Preços oficiais por quantidade de dezenas marcadas (ver REGRAS/regras.md,
// seção 3 — valores de referência, sujeitos a reajuste pela Caixa).
export const PRECOS_POR_DEZENA = {
  15: 3.5,
  16: 56.0,
  17: 476.0,
  18: 2856.0,
  19: 13566.0,
  20: 54264.0,
};

export function valorJogo(quantidadeDezenas) {
  return PRECOS_POR_DEZENA[quantidadeDezenas] ?? 0;
}

export function valorTotal(jogos) {
  return jogos.reduce((soma, jogo) => soma + valorJogo(jogo.dezenas.length), 0);
}

export function rotuloDezenas(jogos) {
  const quantidades = [...new Set(jogos.map((j) => j.dezenas.length))].sort((a, b) => a - b);
  return `${quantidades.join(", ")} Dezenas`;
}

export function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
