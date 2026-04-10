import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    buscarPlano,
    buscarPlanoProfessor,
    salvarPlanoProfessor,
    listarBNCC
} from "../services/api";
import {
    ArrowLeft,
    Save,
    CircleArrowLeft,
    CircleArrowRight,
    BookCheck,
    CopyCheck,
    CopyX,
    Plus,
    MinusCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import "./coordenador.css";

export default function EditarPlanoProfessor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();

    const tiposAvaliacaoRef = useRef(null);
    const observacoesRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [modeloBase, setModeloBase] = useState(null);
    const [popup, setPopup] = useState({ show: false, mensagem: "", tipo: "" });
    const [etapa, setEtapa] = useState(1);
    const [bncc, setBncc] = useState({});
    const [busca, setBusca] = useState("");
    const [erro, setErro] = useState("");
    const [novoGenero, setNovoGenero] = useState("");

    const chaveEtapa = usuario?.id ? `plano_professor_etapa_${usuario.id}_${id}` : "";
    const chaveDraft = usuario?.id ? `plano_professor_draft_${usuario.id}_${id}` : "";

    const [planoProfessor, setPlanoProfessor] = useState({
        componente: "",
        ano: "",
        periodo: "",
        campo_atuacao: "",
        generos: [],
        habilidades: [],
        objetos: [],
        instrumentos: [],
        recursosAvaliacao: [],
        tiposAvaliacaoTexto: "",
        metodologias: [],
        recursosMetodologia: [],
        observacoes: "",
        status: "em_andamento"
    });

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
        computacao: "Computação"
    };

    const camposAtuacao = [
        "Campo da vida cotidiana",
        "Campo artístico-literário",
        "Campo das práticas de estudo e pesquisa",
        "Campo jornalístico-midiático",
        "Campo de atuação na vida pública"
    ];

    const opcoesGeneros = [
        "Poema",
        "Conto",
        "Crônica",
        "Notícia",
        "Reportagem",
        "Carta",
        "Bilhete",
        "Fábula",
        "Tirinha",
        "História em quadrinhos",
        "Anúncio",
        "Verbete",
        "Resumo",
        "Entrevista",
        "Artigo de opinião"
    ];

    const opcoesInstrumentosPadrao = [
        "Prova objetiva de múltipla-escolha",
        "Prova oral",
        "Prova discursiva",
        "Vistos em caderno",
        "Observação e Participação em Leitura",
        "Observação e Participação",
        "Exercícios escritos",
        "Atividade Oral",
        "Avaliação por pares em produção textual",
        "Atividade interpretativa",
        "Participação em debates e roda de leitura",
        "Registros reflexivos (orais e escritos)",
        "Envolvimento de prática de leitura",
        "Análise de produção textual",
        "Revisão de reescrita textual",
        "Atividade de reconto oral ou declamação",
        "Registros escritos das análise de efeito de sentido",
        "Exercício de análise em interpretação",
        "Atividade de reescrita orientada",
        "Produção textual: clareza e coerência"
    ];

    const recursosAvaliacaoPadrao = [
        "Escrita no quadro",
        "Impressão em folha",
        "Livro didático",
        "Ditada",
        "Projeção da atividade",
        "Jogos",
        "Links"
    ];

    const metodologiasPadrao = [
        "Expositiva ou instrucional",
        "Seminário",
        "Debate",
        "Sala de aula invertida",
        "Gamificação",
        "Ensino Hibrido",
        "Design Thinking",
        "STEAM",
        "Cultura Maker"
    ];

    const recursosMetodologiaPadrao = [
        "Caixa amplificada",
        "Escrita no quadro",
        "Projeção de aula",
        "Impressão em folha",
        "Livro didático",
        "Jogos",
        "Vídeos",
        "Materiais concretos",
        "Áudios",
        "Cartazes",
        "Pesquisas na internet"
    ];

    const opcoesInstrumentos = (modeloBase?.instrumentos && modeloBase.instrumentos.length > 0)
        ? modeloBase.instrumentos
        : opcoesInstrumentosPadrao;

    const opcoesRecursosAvaliacao = (modeloBase?.instrumentos_recursos && modeloBase.instrumentos_recursos.length > 0)
        ? modeloBase.instrumentos_recursos
        : recursosAvaliacaoPadrao;

    const opcoesMetodologias = (modeloBase?.metodologias && modeloBase.metodologias.length > 0)
        ? modeloBase.metodologias
        : metodologiasPadrao;

    const opcoesRecursosMetodologia = (modeloBase?.metodologias_recursos && modeloBase.metodologias_recursos.length > 0)
        ? modeloBase.metodologias_recursos
        : recursosMetodologiaPadrao;


    useEffect(() => {
        if (tiposAvaliacaoRef.current) {
            tiposAvaliacaoRef.current.style.height = "auto";
            tiposAvaliacaoRef.current.style.height =
                tiposAvaliacaoRef.current.scrollHeight + "px";
        }

        if (observacoesRef.current) {
            observacoesRef.current.style.height = "auto";
            observacoesRef.current.style.height =
                observacoesRef.current.scrollHeight + "px";
        }
    }, [planoProfessor.tiposAvaliacaoTexto, planoProfessor.observacoes]);


    useEffect(() => {
        async function carregarModelo() {
            try {
                const dadosModelo = await buscarPlano(id);
                const dadosProfessor = await buscarPlanoProfessor(usuario.id, id);

                setModeloBase(dadosModelo);

                let estadoInicial = {
                    componente: dadosModelo.componente || "",
                    ano: dadosModelo.ano || "",
                    periodo: dadosModelo.periodo || "",
                    campo_atuacao: "",
                    generos: [],
                    habilidades: [],
                    objetos: [],
                    instrumentos: [],
                    recursosAvaliacao: [],
                    tiposAvaliacaoTexto: "",
                    metodologias: [],
                    recursosMetodologia: [],
                    observacoes: "",
                    status: "em_andamento"
                };

                if (dadosProfessor) {
                    estadoInicial = {
                        componente: dadosProfessor.componente || dadosModelo.componente || "",
                        ano: dadosProfessor.ano || dadosModelo.ano || "",
                        periodo: dadosProfessor.periodo || dadosModelo.periodo || "",
                        campo_atuacao: dadosProfessor.campo_atuacao || "",
                        generos: dadosProfessor.generos || [],
                        habilidades: dadosProfessor.habilidades || [],
                        objetos: dadosProfessor.objetos || [],
                        instrumentos: dadosProfessor.instrumentos || [],
                        recursosAvaliacao: dadosProfessor.instrumentos_recursos || [],
                        tiposAvaliacaoTexto: Array.isArray(dadosProfessor.tipos_avaliacao)
                            ? dadosProfessor.tipos_avaliacao.join("\n")
                            : "",
                        metodologias: dadosProfessor.metodologias || [],
                        recursosMetodologia: dadosProfessor.metodologias_recursos || [],
                        observacoes: dadosProfessor.observacoes || "",
                        status: dadosProfessor.status || "em_andamento"
                    };
                }

                if (chaveDraft) {
                    const draftSalvo = localStorage.getItem(chaveDraft);
                    if (draftSalvo) {
                        try {
                            const draftParseado = JSON.parse(draftSalvo);
                            estadoInicial = {
                                ...estadoInicial,
                                ...draftParseado
                            };
                        } catch {
                        }
                    }
                }

                setPlanoProfessor(estadoInicial);

                if (chaveEtapa) {
                    const etapaSalva = localStorage.getItem(chaveEtapa);
                    if (etapaSalva) {
                        setEtapa(Number(etapaSalva));
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar modelo do coordenador:", error);
            } finally {
                setLoading(false);
            }
        }

        if (usuario?.id) {
            carregarModelo();
        }
    }, [id, usuario, chaveDraft, chaveEtapa]);

    useEffect(() => {
        if (planoProfessor.componente && planoProfessor.ano) {
            listarBNCC(planoProfessor.componente, String(planoProfessor.ano).replace("º", ""))
                .then(setBncc)
                .catch((error) => {
                    console.error("Erro ao carregar BNCC:", error);
                    setBncc({});
                });
        }
    }, [planoProfessor.componente, planoProfessor.ano]);

    useEffect(() => {
        if (!loading && chaveDraft) {
            localStorage.setItem(chaveDraft, JSON.stringify(planoProfessor));
        }
    }, [planoProfessor, loading, chaveDraft]);

    useEffect(() => {
        if (!loading && chaveEtapa) {
            localStorage.setItem(chaveEtapa, String(etapa));
        }
    }, [etapa, loading, chaveEtapa]);

    function toggleItem(campo, valor) {
        setPlanoProfessor((prev) => {
            const listaAtual = Array.isArray(prev[campo]) ? prev[campo] : [];
            const jaExiste = listaAtual.includes(valor);

            return {
                ...prev,
                [campo]: jaExiste
                    ? listaAtual.filter((item) => item !== valor)
                    : [...listaAtual, valor]
            };
        });
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setPlanoProfessor((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function selecionarTodos(campo, lista) {
        setPlanoProfessor((prev) => ({
            ...prev,
            [campo]: lista
        }));
    }

    function limparTodos(campo) {
        setPlanoProfessor((prev) => ({
            ...prev,
            [campo]: []
        }));
    }

    function adicionarGenero() {
        if (!novoGenero) {
            setErro("Selecione um gênero.");
            return;
        }

        setPlanoProfessor((prev) => {
            if (prev.generos.includes(novoGenero)) {
                setErro("Esse gênero já foi adicionado.");
                return prev;
            }

            return {
                ...prev,
                generos: [...prev.generos, novoGenero]
            };
        });

        setErro("");
        setNovoGenero("");
    }

    function removerGenero(genero) {
        setPlanoProfessor((prev) => ({
            ...prev,
            generos: prev.generos.filter((item) => item !== genero)
        }));
    }

    function objetosFiltrados() {
        let objs = [];

        Object.entries(bncc).forEach(([_, objetos]) => {
            Object.entries(objetos).forEach(([objNome, habilidades]) => {
                habilidades.forEach((h) => {
                    if (planoProfessor.habilidades.includes(h.codigo)) {
                        objs.push(objNome);
                    }
                });
            });
        });

        const objetosRelacionados = [...new Set(objs)];

        if (modeloBase?.objetos?.length > 0) {
            return objetosRelacionados.filter((obj) => modeloBase.objetos.includes(obj));
        }

        return objetosRelacionados;
    }

    function validarEtapa1() {
        if (!planoProfessor.campo_atuacao) {
            setErro("Selecione o Campo de Atuação.");
            return;
        }

        if (!planoProfessor.generos || planoProfessor.generos.length === 0) {
            setErro("Selecione pelo menos um Gênero.");
            return;
        }

        if (!planoProfessor.habilidades || planoProfessor.habilidades.length === 0) {
            setErro("Selecione pelo menos uma Habilidade.");
            return;
        }

        setErro("");
        setEtapa(2);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const tiposAvaliacao = planoProfessor.tiposAvaliacaoTexto
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);

        const payload = {
            componente: planoProfessor.componente,
            ano: planoProfessor.ano,
            periodo: planoProfessor.periodo,
            campo_atuacao: planoProfessor.campo_atuacao,
            generos: planoProfessor.generos,
            habilidades: planoProfessor.habilidades,
            objetos: planoProfessor.objetos,
            instrumentos: planoProfessor.instrumentos,
            instrumentos_recursos: planoProfessor.recursosAvaliacao,
            tipos_avaliacao: tiposAvaliacao,
            metodologias: planoProfessor.metodologias,
            metodologias_recursos: planoProfessor.recursosMetodologia,
            observacoes: planoProfessor.observacoes,
            status: "finalizado"
        };

        try {
            const resposta = await salvarPlanoProfessor(usuario.id, id, payload);

            if (resposta.error || resposta.erro) {
                setPopup({
                    show: true,
                    mensagem: resposta.error || resposta.erro,
                    tipo: "erro"
                });
                return;
            }

            localStorage.removeItem(chaveDraft);
            localStorage.removeItem(chaveEtapa);

            setPopup({
                show: true,
                mensagem: "Plano do professor salvo com sucesso!",
                tipo: "sucesso"
            });

            setTimeout(() => {
                setPopup({ show: false, mensagem: "", tipo: "" });
                navigate("/professor");
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar plano do professor:", error);
            setPopup({
                show: true,
                mensagem: "Erro ao salvar plano do professor.",
                tipo: "erro"
            });
        }
    }

    if (loading) {
        return <div style={{ padding: "30px" }}>Carregando modelo...</div>;
    }

    if (!modeloBase) {
        return <div style={{ padding: "30px" }}>Modelo não encontrado.</div>;
    }

    function autoResize(ref) {
        if (!ref.current) return;

        ref.current.style.height = "auto";
        ref.current.style.height = ref.current.scrollHeight + "px";
    }

    function habilidadesComDescricao() {
        const mapaHabilidades = [];

        Object.entries(bncc).forEach(([_, objetos]) => {
            Object.entries(objetos).forEach(([__, habilidades]) => {
                habilidades.forEach((h) => {
                    mapaHabilidades.push({
                        codigo: h.codigo,
                        descricao: h.descricao
                    });
                });
            });
        });

        return (modeloBase.habilidades || [])
            .map((codigo) => {
                const encontrada = mapaHabilidades.find((h) => h.codigo === codigo);

                return {
                    codigo,
                    descricao: encontrada ? encontrada.descricao : codigo
                };
            })
            .filter((item) =>
                `${item.codigo} ${item.descricao}`.toLowerCase().includes(busca.toLowerCase())
            );
    }


    return (
        <>
            {popup.show && (
                <Toast
                    key={popup.mensagem}
                    mensagem={popup.mensagem}
                    tipo={popup.tipo}
                    onClose={() => setPopup({ show: false, mensagem: "", tipo: "" })}
                />
            )}

            <Toast
                key={erro}
                mensagem={erro}
                tipo="erro"
                onClose={() => setErro("")}
            />

            <div className="box">
                <h1>Editar Plano do Professor</h1>

                <div className="resumo-edicao">
                    <p><strong>Componente:</strong> {nomesComponentes[planoProfessor.componente] || planoProfessor.componente}</p>
                    <p><strong>Ano:</strong> {planoProfessor.ano}</p>
                    <p><strong>Período:</strong> {planoProfessor.periodo || "Não definido"}</p>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <div>
                        <p>
                            Selecione os itens do modelo enviados pelo coordenador conforme a
                            realidade da sua turma.
                        </p>
                    </div>

                    <button className="btn-voltar" onClick={() => navigate("/professor")}>
                        <ArrowLeft size={18} />
                        Voltar
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {etapa === 1 && (
                        <>
                            <h2>Campo de Atuação</h2>
                            <select
                                name="campo_atuacao"
                                value={planoProfessor.campo_atuacao}
                                onChange={handleChange}
                            >
                                <option value="">Selecione o campo de atuação</option>
                                {camposAtuacao.map((campo) => (
                                    <option key={campo} value={campo}>
                                        {campo}
                                    </option>
                                ))}
                            </select>

                            <h2>Gêneros</h2>

                            <div className="turma-builder">
                                <div className="turma-builder-grid escola-builder-grid">
                                    <div className="form-group">
                                        <label>Gênero</label>
                                        <select
                                            value={novoGenero}
                                            onChange={(e) => setNovoGenero(e.target.value)}
                                        >
                                            <option value="">Selecione o gênero</option>
                                            {opcoesGeneros.map((genero) => (
                                                <option key={genero} value={genero}>
                                                    {genero}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="turma-btn-area">
                                        <button
                                            type="button"
                                            className="btn-add-turma"
                                            onClick={adicionarGenero}
                                        >
                                            <Plus size={18} />
                                            Adicionar
                                        </button>
                                    </div>
                                </div>

                                <div className="turmas-selecionadas">
                                    {planoProfessor.generos.length > 0 ? (
                                        planoProfessor.generos.map((genero) => (
                                            <div key={genero} className="turma-tag">
                                                <span>{genero}</span>
                                                <button
                                                    type="button"
                                                    className="btn-remover-turma"
                                                    onClick={() => removerGenero(genero)}
                                                >
                                                    <MinusCircle size={16} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="turma-vazia">Nenhum gênero adicionado.</div>
                                    )}
                                </div>
                            </div>

                            <h2>Habilidades sugeridas pelo coordenador</h2>
                            <input
                                placeholder="Buscar habilidade..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />

                            <div className="lista">
                                {habilidadesComDescricao().map((item, index) => (
                                    <label key={index}>
                                        <input
                                            type="checkbox"
                                            checked={planoProfessor.habilidades.includes(item.codigo)}
                                            onChange={() => toggleItem("habilidades", item.codigo)}
                                        />
                                        <span>
                                            <span className="habilidade-codigo">({item.codigo})</span>
                                            <span className="habilidade-texto">{item.descricao}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("habilidades", modeloBase.habilidades || [])}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("habilidades")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <div className="acoes">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={validarEtapa1}
                                >
                                    <CircleArrowRight color="#ffffff" size={30} />
                                </button>
                            </div>
                        </>
                    )}

                    {etapa === 2 && (
                        <>
                            <h2>Objetos de Conhecimento</h2>

                            <div className="lista">
                                {objetosFiltrados().map((obj) => (
                                    <label key={obj}>
                                        <input
                                            type="checkbox"
                                            checked={planoProfessor.objetos.includes(obj)}
                                            onChange={() => toggleItem("objetos", obj)}
                                        />
                                        {obj}
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("objetos", objetosFiltrados())}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("objetos")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <div className="acoes">
                                <button
                                    type="button"
                                    className="btn btn-info"
                                    onClick={() => setEtapa(1)}
                                >
                                    <CircleArrowLeft color="#ffffff" size={30} />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setEtapa(3)}
                                >
                                    <CircleArrowRight color="#ffffff" size={30} />
                                </button>
                            </div>
                        </>
                    )}

                    {etapa === 3 && (
                        <>
                            <h2>Instrumentos Avaliativos</h2>
                            {opcoesInstrumentos.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={planoProfessor.instrumentos.includes(item)}
                                        onChange={() => toggleItem("instrumentos", item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("instrumentos", opcoesInstrumentos)}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("instrumentos")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <h3>Recursos usados na mensuração da aprendizagem</h3>
                            {opcoesRecursosAvaliacao.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={planoProfessor.recursosAvaliacao.includes(item)}
                                        onChange={() => toggleItem("recursosAvaliacao", item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("recursosAvaliacao", opcoesRecursosAvaliacao)}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("recursosAvaliacao")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <div className="acoes">
                                <button
                                    type="button"
                                    className="btn btn-info"
                                    onClick={() => setEtapa(2)}
                                >
                                    <CircleArrowLeft color="#ffffff" size={30} />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setEtapa(4)}
                                >
                                    <CircleArrowRight color="#ffffff" size={30} />
                                </button>
                            </div>
                        </>
                    )}

                    {etapa === 4 && (
                        <>
                            <h2>Critérios Avaliativos</h2>

                            {Array.isArray(modeloBase.tipos_avaliacao) && modeloBase.tipos_avaliacao.length > 0 && (
                                <div className="resumo-edicao" style={{ marginBottom: "16px" }}>
                                    <p>
                                        <strong>Sugestões do coordenador:</strong>{" "}
                                        {modeloBase.tipos_avaliacao.join("; ")}
                                    </p>
                                </div>
                            )}

                            <div className="chat-input-wrap">
                                <textarea
                                    ref={tiposAvaliacaoRef}
                                    name="tiposAvaliacaoTexto"
                                    value={planoProfessor.tiposAvaliacaoTexto || ""}
                                    onChange={(e) => {
                                        handleChange(e);
                                        e.target.style.height = "0px";
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="chat-input-area"
                                    placeholder="Descreva os tipos de avaliação que serão utilizados..."
                                    rows={1}
                                />
                            </div>

                            <div className="acoes">
                                <button
                                    type="button"
                                    className="btn btn-info"
                                    onClick={() => setEtapa(3)}
                                >
                                    <CircleArrowLeft color="#ffffff" size={30} />
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setEtapa(5)}
                                >
                                    <CircleArrowRight color="#ffffff" size={30} />
                                </button>
                            </div>
                        </>
                    )}

                    {etapa === 5 && (
                        <>
                            <h2>Metodologias</h2>
                            {opcoesMetodologias.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={planoProfessor.metodologias.includes(item)}
                                        onChange={() => toggleItem("metodologias", item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("metodologias", opcoesMetodologias)}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("metodologias")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <h3>Recursos usados na abordagem do conhecimento</h3>
                            {opcoesRecursosMetodologia.map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        checked={planoProfessor.recursosMetodologia.includes(item)}
                                        onChange={() => toggleItem("recursosMetodologia", item)}
                                    />
                                    {item}
                                </label>
                            ))}
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => selecionarTodos("recursosMetodologia", opcoesRecursosMetodologia)}
                            >
                                <CopyCheck color="#ffff" size={15} />
                                Selecionar todos
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => limparTodos("recursosMetodologia")}
                            >
                                <CopyX color="#ffff" size={15} />
                                Desmarcar todos
                            </button>

                            <div className="form-group" style={{ marginTop: "30px" }}>
                                <h2>Observações do Professor</h2>
                                <div className="chat-input-wrap">
                                    <textarea
                                        ref={observacoesRef}
                                        name="observacoes"
                                        value={planoProfessor.observacoes}
                                        onChange={(e) => {
                                            handleChange(e);
                                            e.target.style.height = "0px";
                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                        className="chat-input-area"
                                        placeholder="Descreva adaptações, realidade da turma, estratégias próprias, etc."
                                        rows={1}
                                    />
                                </div>
                            </div>

                            <div className="acoes">

                                <button type="submit" className="btn btn-primary btn-right btn-margem">
                                    <BookCheck color="#ffff" size={20} />
                                    SALVAR
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <div className="progress-container">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${(etapa / 5) * 100}%`,
                            background: (etapa / 5) === 1 ? "#16a34a" : "linear-gradient(90deg, #3b82f6, #60a5fa)"
                        }}
                    />
                </div>
            </div>
        </>
    );
}