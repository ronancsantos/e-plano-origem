import { useEffect, useState } from "react";
import { cadastrarUsuario, listarUsuarios, deletarUsuario } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trash2, LogOut, UserPlus } from "lucide-react";
import "./usuarios.css";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo: "coordenador",
  });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const tipoUsuarioLogado = usuario?.tipo || usuario?.perfil || "";

  async function carregarUsuarios() {
    try {
      const dados = await listarUsuarios();

      if (Array.isArray(dados)) {
        const filtrados = dados.filter((u) => {
          const tipo = u.tipo || u.perfil;
          return tipo === "admin" || tipo === "coordenador";
        });

        setUsuarios(filtrados);
        setErro("");
      } else {
        setUsuarios([]);
        setErro(dados?.erro || dados?.error || "Erro ao carregar usuários.");
      }
    } catch (error) {
      setUsuarios([]);
      setErro("Erro ao conectar com o servidor.");
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem("");
    setErro("");
    setCarregando(true);

    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        tipo: form.tipo
      };

      const resposta = await cadastrarUsuario(payload);

      if (resposta.usuario || resposta.mensagem) {
        setMensagem("Usuário cadastrado com sucesso!");
        setForm({
          nome: "",
          email: "",
          senha: "",
          tipo: "coordenador"
        });
        carregarUsuarios();
      } else {
        setErro(resposta.erro || resposta.error || "Erro ao cadastrar usuário.");
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleDelete(usuarioAlvo) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o usuário "${usuarioAlvo.nome}"?`
    );

    if (!confirmar) return;

    try {
      const resposta = await deletarUsuario(usuarioAlvo.id);

      if (resposta.mensagem || resposta.ok) {
        setMensagem("Usuário removido com sucesso!");
        setErro("");
        carregarUsuarios();
      } else {
        setErro(resposta.erro || resposta.error || "Erro ao excluir usuário.");
        setMensagem("");
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
      setMensagem("");
    }
  }

  function sair() {
    logout();
    navigate("/login");
  }

  function podeExcluir(alvo) {
    if (!usuario) return false;

    const tipoAtual = usuario.tipo || usuario.perfil;
    const tipoAlvo = alvo.tipo || alvo.perfil;

    if (Number(alvo.id) === Number(usuario.id)) return false;

    if (tipoAtual === "admin") return true;

    if (tipoAtual === "coordenador" && tipoAlvo === "coordenador") {
      return false;
    }

    return false;
  }

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <div className="usuarios-topo">
          <div>
            <h1>Gestão de Usuários</h1>
            <p>
              Olá, <strong>{usuario?.nome}</strong> ({tipoUsuarioLogado})
            </p>
          </div>

          <div className="acoes-topo">
            <button className="btn-voltar" onClick={() => navigate("/")}>
              Voltar
            </button>

            <button className="btn-sair" onClick={sair}>
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>

        <div className="usuarios-grid">
          <div className="card card-form">
            <h2>
              <UserPlus size={20} />
              Cadastrar Usuário
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Digite o nome"
                  required
                />
              </div>

              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Digite o e-mail"
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  name="senha"
                  value={form.senha}
                  onChange={handleChange}
                  placeholder="Digite a senha"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                >
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {mensagem && <div className="msg-sucesso">{mensagem}</div>}
              {erro && <div className="msg-erro">{erro}</div>}

              <button
                type="submit"
                className="btn-cadastrar"
                disabled={carregando}
              >
                {carregando ? "Cadastrando..." : "Cadastrar usuário"}
              </button>
            </form>
          </div>

          <div className="card card-lista">
            <h2>Administradores e Coordenadores</h2>

            <div className="tabela-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Tipo</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map((u) => {
                      const tipoItem = u.tipo || u.perfil || "";

                      return (
                        <tr key={u.id}>
                          <td>{u.nome}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge ${tipoItem}`}>
                              {tipoItem === "admin" ? "admin" : "Coordenador"}
                            </span>
                          </td>
                          <td>
                            {podeExcluir(u) ? (
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(u)}
                                title="Excluir usuário"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4">
                        {erro || "Nenhum administrador ou coordenador cadastrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}