"use client";

import { useState } from "react";

export default function QuinzenaModal({ carregando, onGerar, onCancelar }) {
  const [quantidadeJogos, setQuantidadeJogos] = useState(5);

  return (
    <div className="modal-fundo" onClick={carregando ? undefined : onCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Quantos jogos deseja criar?</h3>
        <p>
          Serão gerados jogos de 15 dezenas, repetindo o mínimo possível de números entre eles.
        </p>

        <div className="controles">
          <div className="campos-grade">
            <label htmlFor="quinzena-quantidade-jogos">Quantos jogos</label>
            <select
              id="quinzena-quantidade-jogos"
              value={quantidadeJogos}
              onChange={(e) => setQuantidadeJogos(Number(e.target.value))}
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "jogo" : "jogos"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-acoes">
          <button className="modal-botao-cancelar" onClick={onCancelar} disabled={carregando}>
            Cancelar
          </button>
          <button className="modal-botao-ok" onClick={() => onGerar(quantidadeJogos)} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar"}
          </button>
        </div>
      </div>
    </div>
  );
}
