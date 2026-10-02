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
export function gerarJogosQuinzena(quantidadeJogos, tamanho = 15) {
  const uso = new Array(26).fill(0);
  const jogos = [];
  const vistos = new Set();

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
      const repetido = vistos.has(candidato.join(","));
      const custo = penalidadeSequencia(candidato) + (repetido ? 1000 : 0);
      if (custo < melhorCusto) {
        melhorCusto = custo;
        melhor = candidato;
      }
    }

    vistos.add(melhor.join(","));
    for (const d of melhor) uso[d]++;
    jogos.push(melhor);
  }

  return jogos;
}
