import { createContext, useContext, useEffect, useState } from "react";
import { buscarUsuarioLogado } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function carregarUsuario() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const dados = await buscarUsuarioLogado(token);

        if (dados?.id) {
          setUsuario(dados);
        } else {
          localStorage.removeItem("token");
          setUsuario(null);
        }
      } catch (error) {
        localStorage.removeItem("token");
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  function login(dados) {
    localStorage.setItem("token", dados.token);
    localStorage.setItem("usuario", JSON.stringify(dados.usuario));
    setUsuario(dados.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}