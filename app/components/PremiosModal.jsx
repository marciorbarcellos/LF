"use client";

const PREMIOS = [
  { acertos: 15, ganhadores: "3", valor: "R$ 432.535,38", tipo: "Variável" },
  { acertos: 14, ganhadores: "200", valor: "R$ 1.943,41", tipo: "Variável" },
  { acertos: 13, ganhadores: "7.753", valor: "R$ 35,00", tipo: "Fixo" },
  { acertos: 12, ganhadores: "98.892", valor: "R$ 14,00", tipo: "Fixo" },
  { acertos: 11, ganhadores: "517.428", valor: "R$ 7,00", tipo: "Fixo" },
];

export default function PremiosModal({ aberto, onFechar }) {
  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Distribuição dos prêmios</h3>
        <p className="texto-secundario">Exemplo: resultado do concurso 3815.</p>

        <table className="tabela-premios">
          <thead>
            <tr>
              <th>Acertos</th>
              <th>Apostas ganhadoras</th>
              <th>Prêmio por aposta</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {PREMIOS.map((p) => (
              <tr key={p.acertos}>
                <td>{p.acertos}</td>
                <td>{p.ganhadores}</td>
                <td>{p.valor}</td>
                <td>{p.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="texto-secundario">
          Segundo a CAIXA, os prêmios de 11, 12 e 13 acertos têm valor fixo. Os de 14 e 15 acertos
          são variáveis: dependem da arrecadação e do número de ganhadores de cada concurso.
        </p>

        <div className="modal-acoes">
          <button className="modal-botao-ok" onClick={onFechar} autoFocus>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
