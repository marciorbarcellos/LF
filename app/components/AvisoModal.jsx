"use client";

export default function AvisoModal({ aberto, titulo, mensagem, onFechar }) {
  if (!aberto) return null;

  return (
    <div
      className="modal-fundo modal-fundo-aviso"
      onClick={(e) => {
        e.stopPropagation();
        onFechar();
      }}
    >
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="modal-acoes">
          <button className="modal-botao-ok" onClick={onFechar} autoFocus>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
