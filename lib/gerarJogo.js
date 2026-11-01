// `excluir`: chaves ("1,2,3,...") que não podem sair — usado para não gerar um
// jogo de 15 dezenas idêntico a um sorteio que já aconteceu de verdade (extra
// cosmético, só se aplica a jogos de exatamente 15 dezenas).
export function gerarDezenas(quantidade, excluir = new Set()) {
  if (quantidade < 15 || quantidade > 20) {
    throw new Error("A quantidade de dezenas deve ser entre 15 e 20.");
  }

  for (let tentativa = 0; tentativa < 1000; tentativa++) {
    const disponiveis = Array.from({ length: 25 }, (_, i) => i + 1);

    for (let i = disponiveis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [disponiveis[i], disponiveis[j]] = [disponiveis[j], disponiveis[i]];
    }

    const dezenas = disponiveis.slice(0, quantidade).sort((a, b) => a - b);
    if (quantidade !== 15 || !excluir.has(dezenas.join(","))) return dezenas;
  }

  // Praticamente impossível de chegar aqui (a chance de colisão é minúscula),
  // mas devolve o último candidato em vez de travar.
  return gerarDezenas(quantidade);
}

// Penaliza sequências de números consecutivos: cada corrida de tamanho L custa (L-1)^2.
function penalidadeSequencia(dezenas) {
  let custo = 0;
  let corrida = 1;
  for (let i = 1; i <= dezenas.length; i++) {
    if (i < dezenas.length && dezenas[i] === dezenas[i - 1] + 1) {
      corrida++;
    } else {
      custo += (corrida - 1) ** 2;
      corrida = 1;
    }
  }
  return custo;
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Gera jogos de 15 dezenas minimizando a repetição de números entre eles: cada jogo
// usa as dezenas menos utilizadas até então (as ainda inéditas primeiro). Quando as
// 25 dezenas se esgotam, o ciclo recomeça equilibrando o uso. Dentro da faixa de
// uso empatada, sorteia combinações e fica com a mais intercalada (menos sequências).
// `jogosExistentes` (chaves "1,2,3,...") são sequências já feitas que não podem se repetir.
export function gerarJogosQuinzena(quantidadeJogos, tamanho = 15, jogosExistentes = new Set()) {
  const uso = new Array(26).fill(0);
  const jogos = [];
  const vistos = new Set(jogosExistentes);

  for (let n = 0; n < quantidadeJogos; n++) {
    const ordenadas = embaralhar(Array.from({ length: 25 }, (_, i) => i + 1)).sort(
      (a, b) => uso[a] - uso[b]
    );
    const usoLimite = uso[ordenadas[tamanho - 1]];
    const obrigatorias = ordenadas.filter((d) => uso[d] < usoLimite);
    const empatadas = ordenadas.filter((d) => uso[d] === usoLimite);
    const faltam = tamanho - obrigatorias.length;

    let melhor = null;
    let melhorCusto = Infinity;
    for (let tentativa = 0; tentativa < 400; tentativa++) {
      const candidato = [...obrigatorias, ...embaralhar(empatadas).slice(0, faltam)].sort(
        (a, b) => a - b
      );
      if (vistos.has(candidato.join(","))) continue;
      const custo = penalidadeSequencia(candidato);
      if (custo < melhorCusto) {
        melhorCusto = custo;
        melhor = candidato;
      }
    }

    // Todas as combinações de menor uso já existiam: sorteia qualquer sequência inédita.
    while (!melhor) {
      const candidato = embaralhar(Array.from({ length: 25 }, (_, i) => i + 1))
        .slice(0, tamanho)
        .sort((a, b) => a - b);
      if (!vistos.has(candidato.join(","))) melhor = candidato;
    }

    vistos.add(melhor.join(","));
    for (const d of melhor) uso[d]++;
    jogos.push(melhor);
  }

  return jogos;
}
