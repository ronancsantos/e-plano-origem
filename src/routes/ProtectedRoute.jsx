import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, perfisPermitidos = [] }) {
  const { usuario, loading } = useAuth();

  function normalizarPerfil(perfil) {
    const valor = (perfil || "").trim().toLowerCase();
    return valor === "administrador" ? "admin" : valor;
  }

  if (loading) {
    return <div style={{ padding: "30px" }}>Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const perfilUsuario = normalizarPerfil(usuario.tipo || usuario.perfil);

  const perfisNormalizados = perfisPermitidos.map((perfil) =>
    normalizarPerfil(perfil)
  );

  if (
    perfisNormalizados.length > 0 &&
    !perfisNormalizados.includes(perfilUsuario)
  ) {
    if (perfilUsuario === "professor") {
      return <Navigate to="/professor" replace />;
    }

    if (perfilUsuario === "admin") {
      return <Navigate to="/usuarios" replace />;
    }

    return <Navigate to="/planos" replace />;
  }

  return children;
}
