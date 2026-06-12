import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { atualizarFotoProfessor, listarModelosProfessor } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Eye,
  Pencil,
  Home,
  User,
  Info,
  TextAlignJustify,
  ChevronLeft,
  Menu,
  X,
  BookText,
  BookCheck,
  Layers3,
  Camera,
  ImageUp
} from "lucide-react";
import "./painelProfessor.css";
import logoGrande from "./logo-professor.png";
import logoMini from "./logo-professor.png";

export default function AbaProfessor() {
  const { usuario, setUsuario, logout } = useAuth();
  const navigate = useNavigate();

  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState("inicio");
  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState("");

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileMenuAberto(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const modelosFiltrados =
    filtroStatus === "todos"
      ? modelos
      : modelos.filter((m) => m.professor_status_exibicao === filtroStatus);

  const nomesComponentes = {
    lingua_portuguesa: "Língua Portuguesa",
    arte: "Arte",
    educacao_fisica: "Educação Física",
    lingua_inglesa: "Língua Inglesa",
    matematica: "Matemática",
    ciencias: "Ciências",
    geografia: "Geografia",
    historia: "História",
    ensino_religioso: "Ensino Religioso",
    computacao: "Computação",
  };

  const nomePeriodo = [
    { value: "1", label: "1º" },
    { value: "2", label: "2º" },
    { value: "3", label: "3º" },
    { value: "4", label: "4º" },
  ];

  const limparPeriodo = (p) => {
    try {
      let valor = p;
      while (
        typeof valor === "string" &&
        (valor.startsWith('"') || valor.startsWith("["))
      ) {
        valor = JSON.parse(valor);
      }

      if (Array.isArray(valor)) valor = valor[0];

      const mapeamento = {
        "1º": "1",
        "1º Período": "1",
        "2º": "2",
        "2º Período": "2",
        "3º": "3",
        "3º Período": "3",
        "4º": "4",
        "4º Período": "4",
      };

      return mapeamento[valor] || valor;
    } catch {
      return p;
    }
  };

  function obterStatusProfessor(modelo) {
    const chaveDraft = usuario?.id
      ? `plano_professor_draft_${usuario.id}_${modelo.id}`
      : "";

    const draft = chaveDraft ? localStorage.getItem(chaveDraft) : null;

    if (modelo.professor_status === "finalizado") {
      return "finalizado";
    }

    if (draft) {
      return "em_andamento";
    }

    return modelo.professor_status || "pendente";
  }

  async function carregarModelos() {
    try {
      if (!usuario?.id) return;

      const data = await listarModelosProfessor(usuario.id);

      const dataNormalizada = Array.isArray(data)
        ? data.map((p) => ({
          ...p,
          periodo: limparPeriodo(p.periodo),
          professor_status_exibicao: obterStatusProfessor(p)
        }))
        : [];

      setModelos(dataNormalizada);
    } catch (error) {
      console.error("Erro ao carregar modelos do professor:", error);
      setModelos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarModelos();
  }, [usuario]);

  function sair() {
    logout();
    navigate("/login");
  }

  const fotoPerfil = usuario?.foto_perfil_url;

  function renderAvatar(tamanho = "normal") {
    return (
      <div className={`avatar-professor ${fotoPerfil ? "com-foto" : ""} ${tamanho}`}>
        {fotoPerfil ? (
          <img src={fotoPerfil} alt={`Foto de ${usuario?.nome || "professor"}`} />
        ) : (
          usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "P"
        )}
      </div>
    );
  }

  function arquivoParaBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !usuario?.id) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErroFoto("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErroFoto("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setErroFoto("");
    setEnviandoFoto(true);

    try {
      const imagemBase64 = await arquivoParaBase64(file);
      const resposta = await atualizarFotoProfessor(usuario.id, {
        imagemBase64,
        contentType: file.type
      });

      if (resposta.error || resposta.erro) {
        setErroFoto(resposta.error || resposta.erro);
        return;
      }

      const usuarioAtualizado = {
        ...usuario,
        ...resposta,
        perfil: "professor",
        tipo: "professor"
      };

      setUsuario(usuarioAtualizado);
      localStorage.setItem("usuario", JSON.stringify(usuarioAtualizado));
    } catch (error) {
      setErroFoto("Erro ao enviar a foto. Tente novamente.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  function renderStatus(status) {
    return (
      <span
        className={`status-badge ${status === "finalizado"
            ? "finalizado"
            : status === "em_andamento"
              ? "em-andamento"
              : "pendente"
          }`}
      >
        {status === "finalizado"
          ? "Concluído"
          : status === "em_andamento"
            ? "Em andamento"
            : "Pendente"}
      </span>
    );
  }

  function renderInicio() {
    const totalPlanos = modelos.length;
    const totalConcluidos = modelos.filter(
      (m) => m.professor_status_exibicao === "finalizado"
    ).length;
    const totalEmAndamento = modelos.filter(
      (m) => m.professor_status_exibicao === "em_andamento"
    ).length;
    const totalPendentes = modelos.filter(
      (m) => m.professor_status_exibicao === "pendente"
    ).length;

    return (
      <>
        <div className="dashboard-resumo">
          <button
            type="button"
            className={`resumo-card azul ${filtroStatus === "todos" ? "ativo" : ""}`}
            onClick={() => setFiltroStatus("todos")}
          >
            <div className="resumo-icone">
              <Layers3 size={30} />
            </div>
            <div>
              <span>Todos os planos</span>
              <strong>{totalPlanos}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`resumo-card verde ${filtroStatus === "finalizado" ? "ativo" : ""}`}
            onClick={() => setFiltroStatus("finalizado")}
          >
            <div className="resumo-icone">
              <BookCheck size={30} />
            </div>
            <div>
              <span>Concluídos</span>
              <strong>{totalConcluidos}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`resumo-card laranja ${filtroStatus === "em_andamento" ? "ativo" : ""}`}
            onClick={() => setFiltroStatus("em_andamento")}
          >
            <div className="resumo-icone">
              <BookText size={30} />
            </div>
            <div>
              <span>Em andamento</span>
              <strong>{totalEmAndamento}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`resumo-card vermelho ${filtroStatus === "pendente" ? "ativo" : ""}`}
            onClick={() => setFiltroStatus("pendente")}
          >
            <div className="resumo-icone">
              <Info size={30} />
            </div>
            <div>
              <span>Pendentes</span>
              <strong>{totalPendentes}</strong>
            </div>
          </button>
        </div>

        <div className="professor-card">
          {loading ? (
            <p className="estado-vazio">Carregando modelos...</p>
          ) : modelosFiltrados.length === 0 ? (
            <p className="estado-vazio">
              Nenhum plano encontrado.
            </p>
          ) : (
            <div className="cards-modelos">
              {modelosFiltrados.map((p) => (
                <div
                  className={`modelo-card ${p.professor_status_exibicao === "finalizado"
                      ? "card-finalizado"
                      : ""
                    }`}
                  key={p.id}
                >
                  <div className="modelo-card-topo">
                    <div className="modelo-titulo-area">
                      <h3>{nomesComponentes[p.componente] || p.componente}</h3>
                      <p className="modelo-subinfo">
                        <strong>Ano:</strong> {p.ano} &nbsp;&nbsp;&nbsp;
                        <strong>Período:</strong>{" "}
                        {nomePeriodo.find((np) => np.value === String(p.periodo))?.label || ""}
                      </p>
                    </div>

                    {renderStatus(p.professor_status_exibicao)}
                  </div>

                  <div className="modelo-acoes">
                    <button
                      onClick={() => navigate(`/professor/plano/${p.id}/visualizar`)}
                      title="Ver modelo"
                      className="acao-btn visualizar"
                    >
                      <Eye size={18} />
                      <span>Ver</span>
                    </button>

                    <button
                      onClick={() => navigate(`/professor/editar/${p.id}`)}
                      title="Editar plano"
                      className="acao-btn editar"
                    >
                      <Pencil size={18} />
                      <span>Criar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderPerfil() {
    return (
      <div className="professor-card">
        <div className="secao-header">
          <h2>Perfil do Professor</h2>
          <p>Informações da sua conta no sistema.</p>
        </div>

        <div className="perfil-foto-card">
          {renderAvatar("grande")}

          <div className="perfil-foto-info">
            <strong>Foto do perfil</strong>
            <span>Envie uma imagem ou tire uma foto pelo celular.</span>
            {erroFoto && <p className="foto-erro">{erroFoto}</p>}
          </div>

          <div className="perfil-foto-acoes">
            <label className="foto-btn">
              <ImageUp size={18} />
              <span>{enviandoFoto ? "Enviando..." : "Enviar foto"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFotoChange}
                disabled={enviandoFoto}
              />
            </label>

            <label className="foto-btn secundario">
              <Camera size={18} />
              <span>Tirar foto</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={handleFotoChange}
                disabled={enviandoFoto}
              />
            </label>
          </div>
        </div>

        <div className="perfil-grid">
          <div className="perfil-item">
            <span>Nome</span>
            <strong>{usuario?.nome || "-"}</strong>
          </div>

          <div className="perfil-item">
            <span>E-mail</span>
            <strong>{usuario?.email || "-"}</strong>
          </div>

          <div className="perfil-item">
            <span>Perfil</span>
            <strong>{usuario?.perfil || usuario?.tipo || "professor"}</strong>
          </div>
        </div>
      </div>
    );
  }

  function renderSobre() {
    return (
      <div className="professor-card">
        <div className="secao-header">
          <h2>Sobre</h2>
          <p>Informações sobre o painel do professor.</p>
        </div>

        <div className="sobre-box">
          <p>
            Este painel foi desenvolvido para que o professor visualize os modelos
            de plano enviados pela coordenação pedagógica e elabore seu planejamento
            com base na realidade da sua turma.
          </p>

          <p>
            Aqui você pode acompanhar os modelos disponíveis, editar seu plano,
            visualizar materiais e manter o andamento do seu trabalho pedagógico
            organizado.
          </p>
        </div>
      </div>
    );
  }

  function renderConteudo() {
    if (menuAtivo === "perfil") return renderPerfil();
    if (menuAtivo === "sobre") return renderSobre();
    return renderInicio();
  }

  const mostrarTexto = isMobile ? true : sidebarExpandida;
  const logoAtual = isMobile
    ? logoGrande
    : sidebarExpandida
      ? logoGrande
      : logoMini;

  return (
    <div className="painel-professor-layout">
      {mobileMenuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuAberto(false)}
        />
      )}

      <aside
        className={`sidebar-professor ${isMobile
            ? mobileMenuAberto
              ? "mobile-aberta"
              : "mobile-fechada"
            : sidebarExpandida
              ? "expandida"
              : "recolhida"
          }`}
      >
        <div className="sidebar-topo">
          <div className="sidebar-logo">
            <img
              src={logoAtual}
              alt="Logo"
              className={`sidebar-logo-img ${isMobile ? "grande" : sidebarExpandida ? "grande" : "pequena"
                }`}
            />
          </div>

          {isMobile ? (
            <button
              className="toggle-sidebar mobile-only"
              onClick={() => setMobileMenuAberto(false)}
              title="Fechar menu"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              className="toggle-sidebar desktop-only"
              onClick={() => setSidebarExpandida(!sidebarExpandida)}
              title={sidebarExpandida ? "Recolher menu" : "Expandir menu"}
            >
              {sidebarExpandida ? (
                <ChevronLeft size={20} />
              ) : (
                <TextAlignJustify size={20} />
              )}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${menuAtivo === "inicio" ? "ativo" : ""}`}
            onClick={() => {
              setMenuAtivo("inicio");
              setMobileMenuAberto(false);
            }}
            title="Início"
          >
            <Home size={20} />
            {mostrarTexto && <span>Início</span>}
          </button>

          <button
            className={`nav-item ${menuAtivo === "perfil" ? "ativo" : ""}`}
            onClick={() => {
              setMenuAtivo("perfil");
              setMobileMenuAberto(false);
            }}
            title="Perfil"
          >
            <User size={20} />
            {mostrarTexto && <span>Perfil</span>}
          </button>

          <button
            className={`nav-item ${menuAtivo === "sobre" ? "ativo" : ""}`}
            onClick={() => {
              setMenuAtivo("sobre");
              setMobileMenuAberto(false);
            }}
            title="Sobre"
          >
            <Info size={20} />
            {mostrarTexto && <span>Sobre</span>}
          </button>

          <button
            className="nav-item sair-btn"
            onClick={sair}
            title="Sair"
          >
            <LogOut size={20} />
            {mostrarTexto && <span>Sair</span>}
          </button>
        </nav>

        <div className="sidebar-usuario">
          {renderAvatar()}

          {mostrarTexto && (
            <div className="usuario-info">
              <strong>{usuario?.nome || "Professor"}</strong>
              <span>{usuario?.email || "painel do professor"}</span>
            </div>
          )}
        </div>
      </aside>

      <main className="conteudo-professor">
        <header className="topbar-professor">
          <div className="topbar-esquerda">
            <button
              className="menu-mobile-btn"
              onClick={() => setMobileMenuAberto((prev) => !prev)}
            >
              {mobileMenuAberto ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div>
              <h1>Olá, {usuario?.nome}</h1>
            </div>
          </div>
        </header>

        {renderConteudo()}
      </main>
    </div>
  );
}
