"use client";

import { useEffect, useState } from "react";

function Dezena({ numero, estado }) {
  const classe =
    estado === "acerto" ? "dezena dezena-acerto" : estado === "erro" ? "dezena dezena-erro" : "dezena";
  return <span className={classe}>{String(numero).padStart(2, "0")}</span>;
}

export default function GeradorJogo() {
  const [quantidade, setQuantidade] = useState(15);
  const [jogos, setJogos] = useState([]);
  const [ultimoConcurso, setUltimoConcurso] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  async function carregarJogos() {
    try {
      const res = await fetch("/api/jogos");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJogos(data.jogos);
      setUltimoConcurso(data.ultimoConcurso);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregarJogos();
  }, []);

  async function gerarJogo() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await carregarJogos();
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Gerar novo jogo</h2>
        {ultimoConcurso && (
          <p className="texto-secundario">
            Próximo concurso: <strong>{ultimoConcurso.numeroConcursoProximo}</strong> em{" "}
            {ultimoConcurso.dataProximoConcurso}
          </p>
        )}

        <div className="controles">
          <label htmlFor="quantidade">Quantas dezenas marcar?</label>
          <select
            id="quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          >
            {[15, 16, 17, 18, 19, 20].map((n) => (
              <option key={n} value={n}>
                {n} dezenas
              </option>
            ))}
          </select>
          <button onClick={gerarJogo} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar jogo"}
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
      </div>

      <div className="card">
        <h2>Meus jogos e conferência de resultados</h2>
        {jogos.length === 0 && <p className="texto-secundario">Nenhum jogo gerado ainda.</p>}

        {jogos.map((jogo) => (
          <div key={jogo._id} className="jogo-item">
            <div className="jogo-item-header">
              <span>Concurso {jogo.concursoAlvo}</span>
              {jogo.conferencia ? (
                <span
                  className={
                    "status-badge " + (jogo.conferencia.acertos >= 11 ? "status-ok" : "status-fail")
                  }
                >
                  {jogo.conferencia.acertos} acertos / {jogo.conferencia.erros} erros
                </span>
              ) : (
                <span className="status-badge status-pendente">Aguardando sorteio</span>
              )}
            </div>
            <div>
              {jogo.dezenas.map((d) => (
                <Dezena
                  key={d}
                  numero={d}
                  estado={
                    jogo.conferencia
                      ? jogo.conferencia.dezenasAcertadas.includes(d)
                        ? "acerto"
                        : "erro"
                      : null
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
