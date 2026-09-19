"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/app/components/ConfirmModal";
import Paginacao from "@/app/components/Paginacao";
import { valorTotal, formatarMoeda } from "@/lib/precos";

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

function CheckboxGrupo({ checked, indeterminado, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminado;
  }, [indeterminado]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />;
}

export default function ListaJogos() {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [selecionados, setSelecionados] = useState(new Set());
  const [modalAberto, setModalAberto] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState(null);

  // Debounce: espera parar de digitar antes de buscar em todo o banco.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  async function carregar(paginaAlvo, termo) {
    setCarregando(true);
    try {
      const url = new URL("/api/jogos", window.location.origin);
      url.searchParams.set("page", paginaAlvo);
      url.searchParams.set("pageSize", "100");
      if (termo) url.searchParams.set("q", termo);

      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setJogos(data.jogos);
      setPaginacao(data.paginacao ?? null);
      setPagina(paginaAlvo);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  // Toda vez que a busca (já debounced) muda, volta para a página 1 e
  // refaz a consulta no banco inteiro — não só na página carregada.
  useEffect(() => {
    carregar(1, buscaAtiva);
  }, [buscaAtiva]);

  const grupos = useMemo(() => agruparPorConcurso(jogos), [jogos]);
  const idsListados = useMemo(() => jogos.map((j) => j._id), [jogos]);
  const jogoMaisRecenteId = pagina === 1 && !buscaAtiva && jogos.length > 0 ? jogos[0]._id : null;
  const todosSelecionados = idsListados.length > 0 && idsListados.every((id) => selecionados.has(id));

  function alternarJogo(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function alternarGrupo(grupo) {
    const idsDoGrupo = grupo.jogos.map((j) => j._id);
    const todosMarcados = idsDoGrupo.every((id) => selecionados.has(id));
    setSelecionados((atual) => {
      const novo = new Set(atual);
      idsDoGrupo.forEach((id) => (todosMarcados ? novo.delete(id) : novo.add(id)));
      return novo;
    });
  }

  function alternarSelecionarTodos() {
    setSelecionados((atual) => {
      if (todosSelecionados) {
        const novo = new Set(atual);
        idsListados.forEach((id) => novo.delete(id));
        return novo;
      }
      const novo = new Set(atual);
      idsListados.forEach((id) => novo.add(id));
      return novo;
    });
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    setErro(null);
    try {
      const res = await fetch("/api/jogos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selecionados) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSelecionados(new Set());
      setModalAberto(false);
      await carregar(pagina, buscaAtiva);
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
          <button
            onClick={() => setModalAberto(true)}
            disabled={excluindo || selecionados.size === 0}
            className="botao-excluir"
          >
            {excluindo ? "Excluindo..." : `Excluir selecionados (${selecionados.size})`}
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {buscaAtiva && (
          <p className="texto-secundario">
            Buscando “{buscaAtiva}” em todos os concursos já gerados, não só nesta página.
          </p>
        )}

        {grupos.length > 0 && (
          <label className="linha-selecionar-todos">
            <input type="checkbox" checked={todosSelecionados} onChange={alternarSelecionarTodos} />
            Selecionar todos os jogos listados
          </label>
        )}
      </div>

      <div className="card">
        {carregando && <p className="texto-secundario">Carregando...</p>}
        {!carregando && grupos.length === 0 && (
          <p className="texto-secundario">Nenhum concurso encontrado.</p>
        )}

        {grupos.map((grupo) => {
          const idsDoGrupo = grupo.jogos.map((j) => j._id);
          const todosDoGrupo = idsDoGrupo.every((id) => selecionados.has(id));
          const algunsDoGrupo = !todosDoGrupo && idsDoGrupo.some((id) => selecionados.has(id));

          return (
            <div key={grupo.chave} className="lote">
              <label className="lote-header lote-header-checkbox">
                <CheckboxGrupo
                  checked={todosDoGrupo}
                  indeterminado={algunsDoGrupo}
                  onChange={() => alternarGrupo(grupo)}
                />
                Concurso {grupo.concursoAlvo ?? "a confirmar"} · {grupo.jogos.length}{" "}
                {grupo.jogos.length === 1 ? "jogo" : "jogos"} · {formatarMoeda(valorTotal(grupo.jogos))}
              </label>

              {grupo.jogos.map((jogo) => {
                const classes = ["jogo-item"];
                if (selecionados.has(jogo._id)) classes.push("jogo-item-selecionado");
                if (jogo._id === jogoMaisRecenteId) classes.push("jogo-item-recente");
                return (
                <div key={jogo._id} className={classes.join(" ")}>
                  {jogo._id === jogoMaisRecenteId && (
                    <p className="lote-recente-aviso">Aguardando o próximo sorteio · os demais são histórico</p>
                  )}
                  <div className="jogo-item-header">
                    <label className="jogo-item-checkbox">
                      <input
                        type="checkbox"
                        checked={selecionados.has(jogo._id)}
                        onChange={() => alternarJogo(jogo._id)}
                      />
                      <span className="texto-secundario">{formatarDataHora(jogo.criadoEm)}</span>
                    </label>
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
                );
              })}
            </div>
          );
        })}

        <Paginacao paginacao={paginacao} onMudarPagina={(p) => carregar(p, buscaAtiva)} />
      </div>

      <ConfirmModal
        aberto={modalAberto}
        titulo="Excluir jogos"
        mensagem={`Excluir ${selecionados.size} jogo(s) selecionado(s)? Essa ação não pode ser desfeita.`}
        carregando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setModalAberto(false)}
      />
    </>
  );
}
