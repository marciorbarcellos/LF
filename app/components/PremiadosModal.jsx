"use client";

export default function PremiadosModal({ grupo, sorteados, onFechar }) {
  if (!grupo) return null;

  const premiados = grupo.jogos
    .filter((jogo) => jogo.conferencia && jogo.conferencia.acertos >= 11)
    .sort((a, b) => b.conferencia.acertos - a.conferencia.acertos);

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div
        className="modal-caixa modal-caixa-premiados"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3>Jogos com 11 acertos ou mais · Concurso {grupo.concursoAlvo}</h3>
        <p className="lote-sorteados premiados-sorteados">
          <strong>Números sorteados:</strong>{" "}
          {sorteados.map((d) => String(d).padStart(2, "0")).join(" – ")}
        </p>

        <div className="premiados-lista">
          {premiados.map((jogo) => (
            <div key={jogo._id} className="jogo-item">
              <div className="jogo-item-header">
                <span className="status-badge status-ok">
                  {jogo.conferencia.acertos} acertos / {jogo.conferencia.erros} erros
                </span>
              </div>
              <div>
                {jogo.dezenas.map((d) => (
                  <span
                    key={d}
                    className={
                      "dezena " +
                      (jogo.conferencia.dezenasAcertadas.includes(d) ? "dezena-acerto" : "dezena-erro")
                    }
                  >
                    {String(d).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-acoes">
          <button className="modal-botao-ok" onClick={onFechar} autoFocus>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
