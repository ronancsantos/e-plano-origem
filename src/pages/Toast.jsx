import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Toast({ mensagem, tipo, onClose }) {
  const [exit, setExit] = useState(false);

  useEffect(() => {
    if (!mensagem) return;

    // Fecha automaticamente após 3s
    const timer = setTimeout(() => handleClose(), 3000);

    // Fecha com Enter
    const handleEnter = (e) => {
      if (e.key === "Enter") handleClose();
    };
    window.addEventListener("keydown", handleEnter);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleEnter);
    };
  }, [mensagem]);

  // Resetar exit toda vez que a mensagem mudar
  useEffect(() => {
    if (mensagem) setExit(false);
  }, [mensagem]);

  const handleClose = () => {
    setExit(true);
    setTimeout(() => onClose(), 400); // espera a animação de saída
  };

  if (!mensagem) return null;

  return (
    <div className={`popup-erro ${tipo} ${exit ? "exit" : ""}`}>
      {tipo === "sucesso" ? (
        <CheckCircle2 color="#16a34a" size={24} />
      ) : (
        <AlertCircle color="#f87171" size={24} />
      )}
      <p>{mensagem}</p>
      <button onClick={handleClose}>OK</button>
    </div>
  );
}