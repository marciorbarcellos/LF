"use client";

export default function ConfirmModal({ aberto, titulo, mensagem, carregando, onConfirmar, onCancelar }) {
  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="modal-acoes">
          <button className="modal-botao-cancelar" onClick={onCancelar} disabled={carregando}>
            Cancelar
          </button>
          <button className="modal-botao-confirmar" onClick={onConfirmar} disabled={carregando}>
            {carregando ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
