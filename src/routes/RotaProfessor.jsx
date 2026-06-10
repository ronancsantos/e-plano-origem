import { Navigate } from "react-router-dom";

export default function RotaProfessor({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (usuario.tipo !== "professor") {
    return <Navigate to="/planos" />;
  }

  return children;
}
