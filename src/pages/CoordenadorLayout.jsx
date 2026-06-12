import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  User,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  TextAlignJustify,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./painelProfessor.css";
import logoGrande from "./logo-professor.png";
import logoMini from "./logo-professor.png";


export default function CoordenadorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();

  const [sidebarExpandida, setSidebarExpandida] = useState(true);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

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

  function sair() {
    logout();
    navigate("/login");
  }

  function navegarMenu(rota) {
    setMobileMenuAberto(false);
    navigate(rota);
  }

  const mostrarTexto = isMobile ? true : sidebarExpandida;
  const logoAtual = isMobile
    ? logoGrande
    : sidebarExpandida
      ? logoGrande
      : logoMini;
  const planosAtivo = location.pathname === "/planos" || location.pathname.startsWith("/coordenador");

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
              className={`sidebar-logo-img ${isMobile ? "grande" : sidebarExpandida ? "grande" : "pequena"}`}
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
            className={`nav-item ${planosAtivo ? "ativo" : ""}`}
            onClick={() => navegarMenu("/planos")}
            title="Planos"
          >
            <Layers3 size={20} />
            {mostrarTexto && <span>Planos</span>}
          </button>

          <button
            className={`nav-item ${location.pathname === "/dashboard-coordenador" ? "ativo" : ""}`}
            onClick={() => navegarMenu("/dashboard-coordenador")}
            title="Acompanhamento"
          >
            <LayoutDashboard size={20} />
            {mostrarTexto && <span>Acompanhamento</span>}
          </button>

          <button
            className={`nav-item ${location.pathname === "/professores-cadastrados" ? "ativo" : ""}`}
            onClick={() => navegarMenu("/professores-cadastrados")}
            title="Usuários"
          >
            
            <User size={20} />
            {mostrarTexto && <span>Usuários</span>}
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
          <div className="avatar-professor">
            {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "C"}
          </div>

          {mostrarTexto && (
            <div className="usuario-info">
              <strong>{usuario?.nome || "Coordenador"}</strong>
              <span>{usuario?.email || "painel do coordenador"}</span>
            </div>
          )}
        </div>
      </aside>

      <main className="conteudo-professor">
        <button
          className="menu-mobile-btn coordenador-menu-mobile"
          onClick={() => setMobileMenuAberto((prev) => !prev)}
        >
          {mobileMenuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>

        {children}
      </main>
    </div>
  );
}
