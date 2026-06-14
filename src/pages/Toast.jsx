import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import "./toast.css";

export default function Toast({ mensagem, tipo = "sucesso", onClose }) {
  const [exit, setExit] = useState(false);

  const handleClose = () => {
    setExit(true);
    setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, 300);
  };

  useEffect(() => {
    if (!mensagem) return undefined;

    const timer = setTimeout(handleClose, 3000);
    const handleEnter = (event) => {
      if (event.key === "Enter") handleClose();
    };

    window.addEventListener("keydown", handleEnter);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleEnter);
    };
  }, [mensagem]);

  useEffect(() => {
    if (mensagem) setExit(false);
  }, [mensagem]);

  if (!mensagem) return null;

  const sucesso = tipo === "sucesso";

  return (
    <div className={`toast-container ${sucesso ? "sucesso" : "erro"} ${exit ? "exit" : ""}`} role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        {sucesso ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
      </span>

      <p className="toast-message">{mensagem}</p>

      <button className="toast-close" type="button" onClick={handleClose} aria-label="Fechar notificacao">
        OK
      </button>
    </div>
  );
}
