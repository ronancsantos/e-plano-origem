import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LogOut,
    Home,
    User,
    Info,
    TextAlignJustify,
    ChevronLeft,
    Menu,
    X,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Users,
    RefreshCw,
    LayoutDashboard
} from "lucide-react";
import { listarResumoDashboardCoordenador } from "../services/api";
import "./dashboard-coordenador.css";
import logoGrande from "./logo-professor.png";
import logoMini from "./logo-professor.png";

export default function DashboardCoordenador() {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();

    const [professoresComResumo, setProfessoresComResumo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const [menuAtivo, setMenuAtivo] = useState("inicio");
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
        }, 5000);

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

        const totalAndamento = professoresComResumo.reduce((acc, professor) => {
            return acc + Number(professor.andamento || 0);
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
            totalAndamento,
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
                            <h1>Dashboard do Coordenador</h1>
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
                    <div className="card-resumo total">
                        <div className="card-icon">
                            <Users size={24} />
                        </div>
                        <div className="card-info">
                            <span>Professores cadastrados</span>
                            <strong>{resumoGeral.totalProfessores}</strong>
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

                    <div className="card-resumo andamento">
                        <div className="card-icon">
                            <Clock3 size={24} />
                        </div>
                        <div className="card-info">
                            <span>Em andamento</span>
                            <strong>{resumoGeral.totalAndamento}</strong>
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

                                    <div className="barra-progresso-wrap">
                                        <div className="barra-progresso">
                                            <div
                                                className="barra-progresso-fill"
                                                style={{ width: `${Number(professor.percentual || 0)}%` }}
                                            />
                                        </div>
                                        <span className="percentual-texto">{Number(professor.percentual || 0)}%</span>
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