export function gerarDezenas(quantidade) {
  if (quantidade < 15 || quantidade > 20) {
    throw new Error("A quantidade de dezenas deve ser entre 15 e 20.");
  }

  const disponiveis = Array.from({ length: 25 }, (_, i) => i + 1);

  for (let i = disponiveis.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [disponiveis[i], disponiveis[j]] = [disponiveis[j], disponiveis[i]];
  }

  return disponiveis.slice(0, quantidade).sort((a, b) => a - b);
}
