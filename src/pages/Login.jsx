import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    senha: ""
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  function normalizarPerfil(perfil) {
    const valor = (perfil || "").trim().toLowerCase();
    return valor === "administrador" ? "admin" : valor;
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const resposta = await loginUsuario(form);

      if (resposta.token) {
        login(resposta);

        const perfil = normalizarPerfil(resposta.usuario.tipo || resposta.usuario.perfil);

        if (perfil === "admin") {
          navigate("/usuarios");
        } else if (perfil === "coordenador") {
          navigate("/");
        } else if (perfil === "professor") {
          navigate("/professor");
        } else {
          navigate("/login");
        }
      } else {
        setErro(resposta.error || resposta.erro || "Erro ao fazer login.");
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>E-Plano</h1>
        <p></p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              name="email"
              placeholder="Digite seu e-mail"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              name="senha"
              placeholder="Digite sua senha"
              value={form.senha}
              onChange={handleChange}
            />
          </div>

          {erro && <div className="erro-login">{erro}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
