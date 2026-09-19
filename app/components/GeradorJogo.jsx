"use client";

import { useEffect, useMemo, useState } from "react";

function Dezena({ numero, estado }) {
  const classe =
    estado === "acerto" ? "dezena dezena-acerto" : estado === "erro" ? "dezena dezena-erro" : "dezena";
  return <span className={classe}>{String(numero).padStart(2, "0")}</span>;
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function agruparPorLote(jogos) {
  const grupos = [];
  let atual = null;
  for (const jogo of jogos) {
    const chave = jogo.loteId ?? jogo._id;
    if (!atual || atual.chave !== chave) {
      atual = { chave, criadoEm: jogo.criadoEm, concursoAlvo: jogo.concursoAlvo, jogos: [] };
      grupos.push(atual);
    }
    atual.jogos.push(jogo);
  }
  return grupos;
}

export default function GeradorJogo() {
  const [quantidade, setQuantidade] = useState(15);
  const [quantidadeJogos, setQuantidadeJogos] = useState(5);
  const [jogos, setJogos] = useState([]);
  const [ultimoConcurso, setUltimoConcurso] = useState(null);
  const [avisoFonteDados, setAvisoFonteDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  async function carregarJogos() {
    try {
      const res = await fetch("/api/jogos");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJogos(data.jogos);
      setUltimoConcurso(data.ultimoConcurso);
      setAvisoFonteDados(data.avisoFonteDados ?? null);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregarJogos();
  }, []);

  async function gerarJogos() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade, quantidadeJogos }),
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

  const grupos = useMemo(() => agruparPorLote(jogos), [jogos]);

  return (
    <>
      <div className="card">
        <h2>Gerar jogos</h2>
        {ultimoConcurso && (
          <p className="texto-secundario">
            Próximo concurso: <strong>{ultimoConcurso.numeroConcursoProximo}</strong> em{" "}
            {ultimoConcurso.dataProximoConcurso}
          </p>
        )}

        <div className="controles">
          <label htmlFor="quantidade">Dezenas por jogo</label>
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

          <label htmlFor="quantidadeJogos">Quantos jogos</label>
          <select
            id="quantidadeJogos"
            value={quantidadeJogos}
            onChange={(e) => setQuantidadeJogos(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "jogo" : "jogos"}
              </option>
            ))}
          </select>

          <button onClick={gerarJogos} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar"}
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {avisoFonteDados && <p className="mensagem-erro">{avisoFonteDados}</p>}
      </div>

      <div className="card">
        <h2>Histórico de jogos gerados</h2>
        <p className="texto-secundario">
          Todo jogo que você gerar fica salvo aqui, agrupado por lote, com a conferência de acertos
          assim que o concurso correspondente for sorteado.
        </p>
        {grupos.length === 0 && <p className="texto-secundario">Nenhum jogo gerado ainda.</p>}

        {grupos.map((grupo) => (
          <div key={grupo.chave} className="lote">
            <div className="lote-header">
              Concurso {grupo.concursoAlvo ?? "a confirmar"} · {formatarDataHora(grupo.criadoEm)} ·{" "}
              {grupo.jogos.length} {grupo.jogos.length === 1 ? "jogo" : "jogos"}
            </div>

            {grupo.jogos.map((jogo) => (
              <div key={jogo._id} className="jogo-item">
                <div className="jogo-item-header">
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
        ))}
      </div>
    </>
  );
}
