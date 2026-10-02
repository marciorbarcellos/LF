"use client";

import { useState } from "react";
import AvisoModal from "@/app/components/AvisoModal";

const TODAS_DEZENAS = Array.from({ length: 25 }, (_, i) => i + 1);

export default function EscolhaModal({ aberto, carregando, onGerar, onCancelar }) {
  const [quantidade, setQuantidade] = useState(15);
  const [quantidadeJogos, setQuantidadeJogos] = useState(5);
  const [selecoes, setSelecoes] = useState(() => Array.from({ length: 5 }, () => []));
  const [aviso, setAviso] = useState(null);

  if (!aberto) return null;

  function mudarQuantidade(valor) {
    setQuantidade(valor);
    setSelecoes(Array.from({ length: quantidadeJogos }, () => []));
  }

  function mudarQuantidadeJogos(valor) {
    setQuantidadeJogos(valor);
    setSelecoes((atual) => Array.from({ length: valor }, (_, i) => atual[i] ?? []));
  }

  function alternar(indiceJogo, dezena) {
    setSelecoes((atual) =>
      atual.map((sel, i) => {
        if (i !== indiceJogo) return sel;
        if (sel.includes(dezena)) return sel.filter((d) => d !== dezena);
        if (sel.length >= quantidade) return sel;
        return [...sel, dezena].sort((a, b) => a - b);
      })
    );
  }

  function gerar() {
    const incompletos = selecoes
      .map((sel, i) => (sel.length === quantidade ? null : i + 1))
      .filter((n) => n !== null);

    if (incompletos.length > 0) {
      setAviso({
        titulo: "Seleção incompleta",
        mensagem:
          `Cada jogo deve ter exatamente ${quantidade} dezenas. ` +
          `Revise ${incompletos.length === 1 ? "o jogo" : "os jogos"}: ${incompletos.join(", ")}.`,
      });
      return;
    }
    onGerar(selecoes, quantidade);
  }

  return (
    <div className="modal-fundo" onClick={carregando ? undefined : onCancelar}>
      <div
        className="modal-caixa modal-caixa-escolha"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3>Escolha os números que deseja</h3>

        <div className="controles escolha-controles">
          <div className="campos-grade">
          <label htmlFor="escolha-quantidade">Dezenas por jogo</label>
          <select
            id="escolha-quantidade"
            value={quantidade}
            onChange={(e) => mudarQuantidade(Number(e.target.value))}
          >
            {[15, 16, 17, 18, 19, 20].map((n) => (
              <option key={n} value={n}>
                {n} dezenas
              </option>
            ))}
          </select>

          <label htmlFor="escolha-quantidade-jogos">Quantos jogos</label>
          <select
            id="escolha-quantidade-jogos"
            value={quantidadeJogos}
            onChange={(e) => mudarQuantidadeJogos(Number(e.target.value))}
          >
            {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "jogo" : "jogos"}
              </option>
            ))}
          </select>
          </div>
        </div>

        <div className="escolha-lista">
          {selecoes.map((sel, i) => (
            <div key={i} className="escolha-jogo">
              <div className="escolha-jogo-header">
                <span>Jogo {i + 1}</span>
                <span className={sel.length === quantidade ? "escolha-contador-ok" : ""}>
                  {sel.length}/{quantidade}
                </span>
              </div>
              <div className="escolha-grade">
                {TODAS_DEZENAS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={"escolha-dezena" + (sel.includes(d) ? " escolha-dezena-ativa" : "")}
                    onClick={() => alternar(i, d)}
                    disabled={carregando}
                  >
                    {String(d).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-acoes">
          <button className="modal-botao-cancelar" onClick={onCancelar} disabled={carregando}>
            Cancelar
          </button>
          <button className="modal-botao-ok" onClick={gerar} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar"}
          </button>
        </div>
      </div>

      <AvisoModal
        aberto={aviso !== null}
        titulo={aviso?.titulo}
        mensagem={aviso?.mensagem}
        onFechar={() => setAviso(null)}
      />
    </div>
  );
}
