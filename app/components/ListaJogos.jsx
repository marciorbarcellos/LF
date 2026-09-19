"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function Dezena({ numero, estado }) {
  const classe =
    estado === "acerto" ? "dezena dezena-acerto" : estado === "erro" ? "dezena dezena-erro" : "dezena";
  return <span className={classe}>{String(numero).padStart(2, "0")}</span>;
}

function formatarDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const CHAVE_SEM_CONCURSO = "sem-concurso";

function agruparPorConcurso(jogos) {
  const mapa = new Map();
  for (const jogo of jogos) {
    const chave = jogo.concursoAlvo ?? CHAVE_SEM_CONCURSO;
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, concursoAlvo: jogo.concursoAlvo, jogos: [] });
    }
    mapa.get(chave).jogos.push(jogo);
  }
  return Array.from(mapa.values()).sort((a, b) => {
    if (a.chave === CHAVE_SEM_CONCURSO) return -1;
    if (b.chave === CHAVE_SEM_CONCURSO) return 1;
    return b.concursoAlvo - a.concursoAlvo;
  });
}

export default function ListaJogos() {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/jogos?limit=500");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJogos(data.jogos);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const grupos = useMemo(() => agruparPorConcurso(jogos), [jogos]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;
    return grupos.filter((g) => {
      const texto = g.chave === CHAVE_SEM_CONCURSO ? "a confirmar" : String(g.concursoAlvo);
      return texto.toLowerCase().includes(termo);
    });
  }, [grupos, busca]);

  const todosSelecionados =
    gruposFiltrados.length > 0 && gruposFiltrados.every((g) => selecionados.has(g.chave));

  function alternarSelecao(chave) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  function alternarSelecionarTodos() {
    setSelecionados((atual) => {
      if (todosSelecionados) {
        const novo = new Set(atual);
        gruposFiltrados.forEach((g) => novo.delete(g.chave));
        return novo;
      }
      const novo = new Set(atual);
      gruposFiltrados.forEach((g) => novo.add(g.chave));
      return novo;
    });
  }

  async function excluirSelecionados() {
    if (selecionados.size === 0) return;
    const concursos = Array.from(selecionados).filter((c) => c !== CHAVE_SEM_CONCURSO);
    const incluirSemConcurso = selecionados.has(CHAVE_SEM_CONCURSO);

    const totalJogos = grupos
      .filter((g) => selecionados.has(g.chave))
      .reduce((soma, g) => soma + g.jogos.length, 0);

    if (!confirm(`Excluir ${selecionados.size} concurso(s), totalizando ${totalJogos} jogo(s)? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setExcluindo(true);
    setErro(null);
    try {
      const res = await fetch("/api/jogos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concursos, incluirSemConcurso }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSelecionados(new Set());
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <div className="card">
        <Link href="/" className="link-voltar">
          ← Voltar para gerar jogos
        </Link>

        <div className="controles">
          <input
            type="search"
            placeholder="busca..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="campo-busca"
          />
          <button onClick={excluirSelecionados} disabled={excluindo || selecionados.size === 0} className="botao-excluir">
            {excluindo ? "Excluindo..." : `Excluir selecionados (${selecionados.size})`}
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        {gruposFiltrados.length > 0 && (
          <label className="linha-selecionar-todos">
            <input type="checkbox" checked={todosSelecionados} onChange={alternarSelecionarTodos} />
            Selecionar todos os concursos listados
          </label>
        )}
      </div>

      <div className="card">
        {carregando && <p className="texto-secundario">Carregando...</p>}
        {!carregando && gruposFiltrados.length === 0 && (
          <p className="texto-secundario">Nenhum concurso encontrado.</p>
        )}

        {gruposFiltrados.map((grupo) => (
          <div key={grupo.chave} className="lote lote-selecionavel">
            <label className="lote-header lote-header-checkbox">
              <input
                type="checkbox"
                checked={selecionados.has(grupo.chave)}
                onChange={() => alternarSelecao(grupo.chave)}
              />
              Concurso {grupo.concursoAlvo ?? "a confirmar"} · {grupo.jogos.length}{" "}
              {grupo.jogos.length === 1 ? "jogo" : "jogos"}
            </label>

            {grupo.jogos.map((jogo) => (
              <div key={jogo._id} className="jogo-item">
                <div className="jogo-item-header">
                  <span className="texto-secundario">{formatarDataHora(jogo.criadoEm)}</span>
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
