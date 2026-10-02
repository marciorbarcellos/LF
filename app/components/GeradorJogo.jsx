"use client";

import { useEffect, useMemo, useState } from "react";
import Paginacao from "@/app/components/Paginacao";
import EscolhaModal from "@/app/components/EscolhaModal";
import QuinzenaModal from "@/app/components/QuinzenaModal";
import AvisoModal from "@/app/components/AvisoModal";
import { valorTotal, formatarMoeda, rotuloDezenas } from "@/lib/precos";

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
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState(null);
  const [escolhaAberta, setEscolhaAberta] = useState(false);
  const [quinzenaAberta, setQuinzenaAberta] = useState(false);
  const [avisoVisto, setAvisoVisto] = useState(false);

  async function carregarJogos(paginaAlvo = pagina) {
    try {
      const res = await fetch(`/api/jogos?page=${paginaAlvo}&pageSize=100`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJogos(data.jogos);
      setUltimoConcurso(data.ultimoConcurso);
      setAvisoFonteDados(data.avisoFonteDados ?? null);
      setPaginacao(data.paginacao ?? null);
      setPagina(paginaAlvo);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregarJogos(1);
  }, []);

  async function gerarJogos(corpo = { quantidade, quantidadeJogos }) {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch("/api/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      await carregarJogos(1);
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    } finally {
      setCarregando(false);
    }
  }

  async function gerarJogosQuinzena(quantidadeJogosQuinzena) {
    const ok = await gerarJogos({ estrategia: "quinzena", quantidadeJogos: quantidadeJogosQuinzena });
    if (ok) {
      setQuinzenaAberta(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function gerarJogosEscolhidos(selecoes, dezenasPorJogo) {
    const ok = await gerarJogos({ quantidade: dezenasPorJogo, jogosManuais: selecoes });
    if (ok) {
      setEscolhaAberta(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const grupos = useMemo(() => agruparPorLote(jogos), [jogos]);

  return (
    <>
      <div className="card">
        {/* <h2>Gerar jogos</h2> */}
        {ultimoConcurso && (
          <p className="texto-secundario">
            Próximo concurso: <strong>{ultimoConcurso.numeroConcursoProximo}</strong> em{" "}
            {ultimoConcurso.dataProximoConcurso}
          </p>
        )}

        <div className="controles">
          <div className="campos-grade">
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

          <label htmlFor="quantidadeJogos">Quantos jogos (bolão, até 100)</label>
          <input
            id="quantidadeJogos"
            type="number"
            min={1}
            max={100}
            value={quantidadeJogos}
            onChange={(e) => {
              const valor = Number(e.target.value) || 1;
              setQuantidadeJogos(Math.min(Math.max(valor, 1), 100));
            }}
            className="campo-numero"
          />
          </div>

          <button onClick={() => gerarJogos()} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar"}
          </button>

          <button className="botao-escolha" onClick={() => setEscolhaAberta(true)} disabled={carregando}>
            Escolha
          </button>

          <button className="botao-quinzena" onClick={() => setQuinzenaAberta(true)} disabled={carregando}>
            QUINZENA
          </button>
        </div>
      </div>

      {quinzenaAberta && (
        <QuinzenaModal
          carregando={carregando}
          onGerar={gerarJogosQuinzena}
          onCancelar={() => setQuinzenaAberta(false)}
        />
      )}

      {escolhaAberta && (
        <EscolhaModal
          aberto
          carregando={carregando}
          onGerar={gerarJogosEscolhidos}
          onCancelar={() => setEscolhaAberta(false)}
        />
      )}

      <AvisoModal
        aberto={Boolean(erro) || (avisoFonteDados && !avisoVisto)}
        titulo={erro ? "Erro" : "Aviso"}
        mensagem={erro || avisoFonteDados}
        onFechar={() => (erro ? setErro(null) : setAvisoVisto(true))}
      />

      <div className="card">
        <h2>Histórico de jogos gerados</h2>
        {grupos.length === 0 && <p className="texto-secundario">Nenhum jogo gerado ainda.</p>}

        {grupos.map((grupo, indice) => (
          <div
            key={grupo.chave}
            className={"lote" + (pagina === 1 && indice === 0 ? " lote-recente" : "")}
          >
            <div className="lote-header">
              Concurso {grupo.concursoAlvo ?? "a confirmar"} · {formatarDataHora(grupo.criadoEm)} ·{" "}
              {grupo.jogos.length} {grupo.jogos.length === 1 ? "jogo" : "jogos"} ·{" "}
              {rotuloDezenas(grupo.jogos)} · {formatarMoeda(valorTotal(grupo.jogos))}
            </div>
            {pagina === 1 && indice === 0 && (
              <p className="lote-recente-aviso">Aguardando o próximo sorteio · os demais abaixo são histórico</p>
            )}

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

        <Paginacao paginacao={paginacao} onMudarPagina={carregarJogos} />
      </div>
    </>
  );
}
