import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, perfisPermitidos = [] }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "30px" }}>Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const perfilUsuario = usuario.tipo || usuario.perfil;

  if (
    perfisPermitidos.length > 0 &&
    !perfisPermitidos.includes(perfilUsuario)
  ) {
    if (perfilUsuario === "professor") {
      return <Navigate to="/professor" replace />;
    }

    if (perfilUsuario === "admin") {
      return <Navigate to="/usuarios" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}