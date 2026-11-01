// Total de combinações possíveis de 15 dezenas entre 25: C(25,15).
export const TOTAL_COMBINACOES = 3268760;

// C(k,15) pré-calculado: quantas combinações de 15 dezenas um jogo de k dezenas cobre.
export const COMBINACOES_COBERTAS_POR_TAMANHO = {
  15: 1,
  16: 16,
  17: 136,
  18: 816,
  19: 3876,
  20: 15504,
};

export function formatarPercentual(valor) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + "%";
}
