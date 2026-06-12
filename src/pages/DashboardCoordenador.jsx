import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LogOut,
    ClipboardList,
    User,
    Info,
    TextAlignJustify,
    ChevronLeft,
    Menu,
    X,
    CheckCircle2,
    AlertCircle,
    Users,
    RefreshCw,
    LayoutDashboard,
    BookOpenCheck
} from "lucide-react";
import { listarResumoDashboardCoordenador } from "../services/api";
import "./dashboard-coordenador.css";
import logoGrande from "./logo-professor.png";
import logoMini from "./logo-professor.png";

export default function DashboardCoordenador() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, logout } = useAuth();

    const [professoresComResumo, setProfessoresComResumo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const [menuAtivo, setMenuAtivo] = useState("acompanhamento");
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

    const carregarDados = async (mostrarLoadingPrincipal = true) => {
        try {
            if (mostrarLoadingPrincipal) {
                setLoading(true);
            } else {
                setAtualizando(true);
            }

            const dados = await listarResumoDashboardCoordenador();
            setProfessoresComResumo(Array.isArray(dados) ? dados : []);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            setProfessoresComResumo([]);
        } finally {
            setLoading(false);
            setAtualizando(false);
        }
    };

    useEffect(() => {
        carregarDados(true);

        const intervalo = setInterval(() => {
            carregarDados(false);
        }, 20000);

        return () => clearInterval(intervalo);
    }, []);

    const resumoGeral = useMemo(() => {
        const totalProfessores = professoresComResumo.length;

        const totalPlanos = professoresComResumo.reduce((acc, professor) => {
            return acc + Number(professor.total || 0);
        }, 0);

        const totalConcluidos = professoresComResumo.reduce((acc, professor) => {
            return acc + Number(professor.concluidos || 0);
        }, 0);

        const totalPendentes = professoresComResumo.reduce((acc, professor) => {
            return acc + Number(professor.pendentes || 0);
        }, 0);

        const professoresEmDia = professoresComResumo.filter((professor) => {
            return Number(professor.total || 0) > 0 &&
                Number(professor.concluidos || 0) === Number(professor.total || 0);
        }).length;

        return {
            totalProfessores,
            totalPlanos,
            totalConcluidos,
            totalPendentes,
            professoresEmDia,
        };
    }, [professoresComResumo]);

    function sair() {
        if (logout) {
            logout();
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
        }

        navigate("/login");
    }

    function navegarMenu(rota) {
        setMobileMenuAberto(false);
        navigate(rota);
    }

    function renderInicio() {
        return (
            <>
                <header className="topbar-professor">
                    <div className="topbar-esquerda">
                        <button
                            className="menu-mobile-btn"
                            onClick={() => setMobileMenuAberto((prev) => !prev)}
                        >
                            {mobileMenuAberto ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <div>
                            <h1>Acompanhemento</h1>
                        </div>
                    </div>

                    <button
                        className={`btn-atualizar ${atualizando ? "girando" : ""}`}
                        onClick={() => carregarDados(false)}
                        type="button"
                    >
                        <RefreshCw size={18} />
                        <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
                    </button>
                </header>

                <section className="cards-grid cards-grid-top">
                    <div className="card-resumo professores-dia">
                        <div className="card-icon">
                            <Users size={24} />
                        </div>
                        <div className="card-info">
                            <span>Professores com planos concluídos</span>
                            <strong>{resumoGeral.professoresEmDia}</strong>
                        </div>
                    </div>

                    <div className="card-resumo total">
                        <div className="card-icon">
                            <ClipboardList size={24} />
                        </div>
                        <div className="card-info">
                            <span>Total de planos</span>
                            <strong>{resumoGeral.totalPlanos}</strong>
                        </div>
                    </div>

                    <div className="card-resumo concluido">
                        <div className="card-icon">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="card-info">
                            <span>Planos concluídos</span>
                            <strong>{resumoGeral.totalConcluidos}</strong>
                        </div>
                    </div>

                    <div className="card-resumo pendente">
                        <div className="card-icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="card-info">
                            <span>Pendentes</span>
                            <strong>{resumoGeral.totalPendentes}</strong>
                        </div>
                    </div>
                </section>

                <section className="painel-planos">
                    <div className="painel-header">

                        <div className="resumo-lateral">
                            <div className="mini-resumo">
                                <span>Professores com planos concluídos</span>
                                <strong>{resumoGeral.professoresEmDia}</strong>
                            </div>

                            <div className="mini-resumo">
                                <span>Total de planos</span>
                                <strong>{resumoGeral.totalPlanos}</strong>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="estado-box">Carregando professores e planos...</div>
                    ) : professoresComResumo.length === 0 ? (
                        <div className="estado-box">Nenhum professor encontrado.</div>
                    ) : (
                        <div className="professores-grid">
                            {professoresComResumo.map((professor, index) => (
                                <div className="professor-card" key={professor.id || index}>
                                    <div className="professor-card-topo">


                                        <div className="professor-info">
                                            <h3>{professor.nome}</h3>

                                            <div className="professor-footer">
                                                {Number(professor.total || 0) === 0 ? (
                                                    <span className="tag-sem-plano">Sem planos disponíveis</span>
                                                ) : Number(professor.concluidos || 0) === Number(professor.total || 0) ? (
                                                    <span className="tag-ok">Todos os planos concluídos</span>
                                                ) : Number(professor.concluidos || 0) > 0 ? (
                                                    <span className="tag-atencao">Acompanhamento em andamento</span>
                                                ) : (
                                                    <span className="tag-pendente-total">Nenhum plano concluído ainda</span>
                                                )}
                                            </div>
                                                
                                        </div>
                                    </div>

                                    <div className="progresso-central">
                                        <div className="progresso-fracao">
                                            <span className="numero-atual">{Number(professor.concluidos || 0)}</span>
                                            <span className="barra-fracao">/</span>
                                            <span className="numero-total">{Number(professor.total || 0)}</span>
                                        </div>
                                        <span className="legenda-fracao">planos concluídos</span>
                                    </div>

                                    <div
                                        className={`progresso-circular ${
                                            Number(professor.total || 0) > 0 &&
                                            Number(professor.concluidos || 0) === Number(professor.total || 0)
                                                ? "finalizado"
                                                : Number(professor.concluidos || 0) > 0
                                                    ? "em-andamento"
                                                    : "pendente"
                                        }`}
                                        style={{ "--percentual": Number(professor.percentual || 0) }}
                                    >
                                        <svg viewBox="0 0 44 44" aria-hidden="true">
                                            <defs>
                                                <linearGradient id="gradiente-acompanhamento" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#f59e0b" />
                                                    <stop offset="100%" stopColor="#ea580c" />
                                                </linearGradient>
                                            </defs>
                                            <circle className="progresso-circular-bg" cx="22" cy="22" r="18" />
                                            <circle
                                                className="progresso-circular-fill"
                                                cx="22"
                                                cy="22"
                                                r="18"
                                                pathLength="100"
                                            />
                                        </svg>
                                        <span>{Number(professor.percentual || 0)}%</span>
                                    </div>

                                    {/* 
                                    <div className="status-lista">
                                        <div className="status-item concluido">
                                            <div className="status-item-left">
                                                <CheckCircle2 size={16} />
                                                <span>Concluídos</span>
                                            </div>
                                            <strong>{Number(professor.concluidos || 0)}</strong>
                                        </div>

                                        <div className="status-item andamento">
                                            <div className="status-item-left">
                                                <Clock3 size={16} />
                                                <span>Em andamento</span>
                                            </div>
                                            <strong>{Number(professor.andamento || 0)}</strong>
                                        </div>

                                        <div className="status-item pendente">
                                            <div className="status-item-left">
                                                <AlertCircle size={16} />
                                                <span>Pendentes</span>
                                            </div>
                                            <strong>{Number(professor.pendentes || 0)}</strong>
                                        </div>
                                    </div>
                                    */}

                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </>
        );
    }

    function renderPerfil() {
        return (
            <>
                <header className="topbar-professor">
                    <div className="topbar-esquerda">
                        <button
                            className="menu-mobile-btn"
                            onClick={() => setMobileMenuAberto((prev) => !prev)}
                        >
                            {mobileMenuAberto ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <div>
                            <h1>Perfil</h1>
                        </div>
                    </div>
                </header>

                <div className="professor-card">
                    <div className="secao-header">
                        <h2>Perfil do Coordenador</h2>
                        <p>Informações da sua conta no sistema.</p>
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
                            <strong>{usuario?.perfil || usuario?.tipo || "coordenador"}</strong>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    function renderSobre() {
        return (
            <>
                <header className="topbar-professor">
                    <div className="topbar-esquerda">
                        <button
                            className="menu-mobile-btn"
                            onClick={() => setMobileMenuAberto((prev) => !prev)}
                        >
                            {mobileMenuAberto ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <div>
                            <h1>Sobre</h1>
                        </div>
                    </div>
                </header>

                <div className="professor-card">
                    <div className="secao-header">
                        <h2>Sobre</h2>
                        <p>Informações sobre o painel do coordenador.</p>
                    </div>

                    <div className="sobre-box">
                        <p>
                            Este painel foi desenvolvido para que a coordenação pedagógica acompanhe
                            os planos enviados aos professores e visualize o andamento de cada um.
                        </p>

                        <p>
                            Aqui você pode acompanhar os planos disponíveis, verificar quantos foram
                            concluídos, quantos estão em andamento e quantos ainda permanecem pendentes.
                        </p>
                    </div>
                </div>
            </>
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
                        className={`nav-item ${location.pathname === "/planos" ? "ativo" : ""}`}
                        onClick={() => {
                            navegarMenu("/planos");
                        }}
                        title="Planos"
                    >
                        <BookOpenCheck size={20} />
                        {mostrarTexto && <span>Planos</span>}
                    </button>

                    <button
                        className={`nav-item ${location.pathname === "/dashboard-coordenador" && menuAtivo === "acompanhamento" ? "ativo" : ""}`}
                        onClick={() => {
                            setMenuAtivo("acompanhamento");
                            navegarMenu("/dashboard-coordenador");
                        }}
                        title="Acompanhamento"
                    >
                        <LayoutDashboard size={20} />
                        {mostrarTexto && <span>Acompanhamento</span>}
                    </button>

                    <button
                        className={`nav-item ${location.pathname === "/professores-cadastrados" ? "ativo" : ""}`}
                        onClick={() => {
                            navegarMenu("/professores-cadastrados");
                        }}
                        title="Usuários"
                    >
                        <ClipboardList size={20} />
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
                {renderConteudo()}
            </main>
        </div>
    );
}
