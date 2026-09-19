"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/app/components/ConfirmModal";

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
  const [selecionados, setSelecionados] = useState(new Set());
  const [modalAberto, setModalAberto] = useState(false);

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

  const idsFiltrados = useMemo(
    () => gruposFiltrados.flatMap((g) => g.jogos.map((j) => j._id)),
    [gruposFiltrados]
  );

  const todosSelecionados = idsFiltrados.length > 0 && idsFiltrados.every((id) => selecionados.has(id));

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
        idsFiltrados.forEach((id) => novo.delete(id));
        return novo;
      }
      const novo = new Set(atual);
      idsFiltrados.forEach((id) => novo.add(id));
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
          <button
            onClick={() => setModalAberto(true)}
            disabled={excluindo || selecionados.size === 0}
            className="botao-excluir"
          >
            {excluindo ? "Excluindo..." : `Excluir selecionados (${selecionados.size})`}
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        {gruposFiltrados.length > 0 && (
          <label className="linha-selecionar-todos">
            <input type="checkbox" checked={todosSelecionados} onChange={alternarSelecionarTodos} />
            Selecionar todos os jogos listados
          </label>
        )}
      </div>

      <div className="card">
        {carregando && <p className="texto-secundario">Carregando...</p>}
        {!carregando && gruposFiltrados.length === 0 && (
          <p className="texto-secundario">Nenhum concurso encontrado.</p>
        )}

        {gruposFiltrados.map((grupo) => {
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
                {grupo.jogos.length === 1 ? "jogo" : "jogos"}
              </label>

              {grupo.jogos.map((jogo) => (
                <div key={jogo._id} className={"jogo-item" + (selecionados.has(jogo._id) ? " jogo-item-selecionado" : "")}>
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
              ))}
            </div>
          );
        })}
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
