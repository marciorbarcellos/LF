"use client";

export default function Paginacao({ paginacao, onMudarPagina }) {
  if (!paginacao || paginacao.total === 0) return null;

  const { page, pageSize, total, totalPaginas } = paginacao;
  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, total);

  return (
    <div className="paginacao">
      <span className="texto-secundario">
        Mostrando {inicio}–{fim} de {total} jogos
      </span>
      <div className="paginacao-botoes">
        <button onClick={() => onMudarPagina(page - 1)} disabled={page <= 1} className="paginacao-botao">
          ← Anterior
        </button>
        <span className="texto-secundario">
          Página {page} de {totalPaginas}
        </span>
        <button
          onClick={() => onMudarPagina(page + 1)}
          disabled={page >= totalPaginas}
          className="paginacao-botao"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
