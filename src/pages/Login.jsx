import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, LockKeyhole, Mail } from "lucide-react";
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
          navigate("/planos");
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
      <section className="login-hero" aria-label="E-Plano">
        
        <h1>Planejamento pedagógico mais simples e organizado.</h1>
        <p>
          Acesse sua área para acompanhar planos, professores e rotinas da rede
          de ensino.
        </p>
      </section>

      <div className="login-card">
        <div className="login-card-header">
          <span className="login-card-kicker">Acesso ao sistema</span>
          <h2>E-plano</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-shell">
              <Mail size={18} aria-hidden="true" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Digite seu e-mail"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <div className="input-shell">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="senha"
                type="password"
                name="senha"
                placeholder="Digite sua senha"
                value={form.senha}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          {erro && <div className="erro-login">{erro}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            <span>{loading ? "Entrando..." : "Entrar"}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>
      </div>

      <p className="login-credit">Powered by RSantos Dev</p>
    </div>
  );
}
