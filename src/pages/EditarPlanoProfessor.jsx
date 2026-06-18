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
import "./editarPlanoProfessor.css";

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
    const [novoDescritor, setNovoDescritor] = useState("");
    const [descritorAberto, setDescritorAberto] = useState(false);
    const [filtroDescritor, setFiltroDescritor] = useState("");
    const [novoGenero, setNovoGenero] = useState("");

    const chaveEtapa = usuario?.id ? `plano_professor_etapa_${usuario.id}_${id}` : "";
    const chaveDraft = usuario?.id ? `plano_professor_draft_${usuario.id}_${id}` : "";

    const [planoProfessor, setPlanoProfessor] = useState({
        componente: "",
        ano: "",
        periodo: "",
        campo_atuacao: "",
        descritores: [],
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
        lp_leitura: "LP - Leitura e Oralidade",
        lp_producao_oralidade: "LP - Produção de Texto-Oralidade",
        lp_analise_linguistica_e_Semiotica: "LP - Análise Linguística e Semiótica",
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
        "Campo das práticas de estudo e pesquisa e Artístico-literário",
        "Campo jornalístico-midiático e Artístico-literário",
        "Campo de atuação na vida pública e Artístico-literário"
    ];

    const opcoesDescritores = [
        "Não se aplica",
        "D1 - Localizar informações explícitas em um texto.",
        "D2 - Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para a continuidade de um texto.",
        "D3 - Inferir o sentido de uma palavra ou expressão.",
        "D4 - Inferir uma informação implícita em um texto.",
        "D5 - Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, foto etc.).",
        "D6 - Identificar o tema de um texto.",
        "D7 - Identificar a tese de um texto.",
        "D8 - Estabelecer relação entre a tese e os argumentos oferecidos para sustentá-la.",
        "D9 - Diferenciar as partes principais das secundárias em um texto.",
        "D10 - Identificar o conflito gerador do enredo e os elementos que constroem a narrativa.",
        "D11 - Estabelecer relação causa/consequência entre partes e elementos do texto.",
        "D12 - Identificar a finalidade de textos de diferentes gêneros.",
        "D13 - Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto.",
        "D14 - Distinguir um fato da opinião relativa a esse fato",
        "D15 - Estabelecer relações lógico-discursivas presentes no texto, marcadas por conjunções, advérbios etc.",
        "D16 - Identificar efeitos de ironia ou humor em textos variados.",
        "D17 - Reconhecer o efeito de sentido decorrente do uso da pontuação e de outras notações.",
        "D18 - Reconhecer o efeito de sentido decorrente da escolha de uma determinada palavra ou expressão.",
        "D19 - Reconhecer o efeito de sentido decorrente da exploração de recursos ortográficos e/ou morfossintáticos.",
        "D20 - Reconhecer diferentes formas de tratar uma informação na comparação de textos que tratam do mesmo tema, em função das condições em que ele foi produzido e daquelas em que será recebido.",
        "D21 - Reconhecer posições distintas entre duas ou mais opiniões relativas ao mesmo fato ou ao mesmo tema.",
        "Analisar os mecanismos que contribuem para a progressão textual.",
        "Analisar os processos de referenciação lexical e pronominal.",
        "Analisar efeitos de sentido produzidos pelo uso de formas de apropriação textual (paráfrase, citação etc.).",
        "Distinguir fatos de opiniões em textos.",
        "Analisar os efeitos de sentido produzidos pelo uso de modalizadores em textos diversos.",
        "Analisar os efeitos de sentido dos tempos, modos e/ou vozes verbais com base no gênero textual e na intenção comunicativa.",
        "Analisar o uso de figuras de linguagem como estratégia argumentativa.",
        "Analisar elementos constitutivos de textos pertencentes ao domínio literário.",
        "Analisar as variedades linguísticas em textos.",
        "Interpretar a presença de valores sociais, culturais e humanos em textos literários.",
        "Analisar a intertextualidade entre textos literários ou entre estes e outros textos verbais ou não verbais.",
        "Analisar os efeitos de sentido decorrentes do uso da pontuação.",
        "Analisar elementos constitutivos de gêneros textuais diversos.",
        "Analisar os efeitos de sentido decorrentes do uso dos adjetivos.",
        "Analisar marcas de parcialidade em textos jornalísticos.",
        "Analisar os efeitos de sentido decorrentes dos mecanismos de construção de textos jornalísticos/midiáticos.",
        "Identificar o uso de recursos persuasivos em textos verbais e não verbais.",
        "Identificar formas de organização de textos normativos, legais e/ou reivindicatórios.",
        "Identificar os recursos de modalização em textos diversos.",
        "Reconhecer os usos da pontuação.",
        "Identificar elementos constitutivos de gêneros de divulgação científica.",
        "Identificar teses/opiniões/posicionamentos explícitos e argumentos em textos.",
        "Reconhecer diferentes gêneros textuais.",
        "Identificar elementos constitutivos de textos pertencentes ao domínio jornalístico/midiático.",
        "Inferir informações implícitas em distintos textos.",
        "Inferir a presença de valores sociais, culturais e humanos em textos literários.",
        "Avaliar a adequação das variedades linguísticas em contextos de uso.",
        "Avaliar a fidedignidade de informações sobre um mesmo fato divulgado em diferentes veículos e mídias.",
        "Avaliar a eficácia das estratégias argumentativas em textos de diferentes gêneros.",
        "Produzir texto em língua portuguesa, de acordo com o gênero textual e o tema demandados."
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
        "Rubricas",
        "Atividade Oral",
        "Seminário",
        "Relatório",
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
        "Links",
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
        "Cultura Maker",
        "Caça ao tesouro pedagógica",
        "Escape Room Educacional",
        "Aprendizagem Baseada em Problemas (ABP/PBL)",
        "Aprendizagem Baseada em Desafios (Challenge-Based Learning)",
        "Aprendizagem Baseada em Mistérios (Mystery-Based Learning)",
        "Trilha de pistas ou Circuito investigativo",
        "RPG Educacional",
        "Detetive Literário",
        "Storytelling Investigativo",
        "Sala de Redação Investigativa",
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
        "Pesquisas na internet",
        "Revistas",
        "Computador",
        "Notebook",
        "Smartphone",
        "Tablet",
        "Smart TV",

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

    function normalizarBusca(valor) {
        return String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    const descritoresFiltrados = opcoesDescritores.filter((descritor) =>
        normalizarBusca(descritor).includes(normalizarBusca(filtroDescritor))
    );

    function selecionarDescritor(descritor) {
        setNovoDescritor(descritor);
        setFiltroDescritor("");
        setDescritorAberto(false);
    }

    function teclaDescritor(e) {
        if (e.key === "Enter" && descritorAberto && descritoresFiltrados.length > 0) {
            e.preventDefault();
            selecionarDescritor(descritoresFiltrados[0]);
            return;
        }

        if (e.key === "Escape") {
            setDescritorAberto(false);
            setFiltroDescritor("");
            return;
        }

        if (e.key === "Backspace") {
            e.preventDefault();
            setDescritorAberto(true);
            setFiltroDescritor((atual) => atual.slice(0, -1));
            return;
        }

        if (e.key.length === 1) {
            e.preventDefault();
            setDescritorAberto(true);
            setFiltroDescritor((atual) => atual + e.key);
        }
    }


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
                    descritores: [],
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
                        descritores: dadosProfessor.descritores || [],
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

    function adicionarDescritor() {
        const descritorSelecionado = opcoesDescritores.find(
            (descritor) => normalizarBusca(descritor) === normalizarBusca(novoDescritor)
        );

        if (!descritorSelecionado) {
            setErro("Selecione um descritor.");
            setDescritorAberto(true);
            return;
        }

        setPlanoProfessor((prev) => {
            const descritoresAtuais = Array.isArray(prev.descritores) ? prev.descritores : [];

            if (descritoresAtuais.includes(descritorSelecionado)) {
                setErro("Esse descritor já foi adicionado.");
                return prev;
            }

            return {
                ...prev,
                descritores: [...descritoresAtuais, descritorSelecionado]
            };
        });

        setErro("");
        setNovoDescritor("");
        setFiltroDescritor("");
        setDescritorAberto(false);
    }

    function removerDescritor(descritor) {
        setPlanoProfessor((prev) => ({
            ...prev,
            descritores: (prev.descritores || []).filter((item) => item !== descritor)
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

    function validarEtapa4() {
        const criterios = String(planoProfessor.tiposAvaliacaoTexto || "").trim();

        if (!criterios) {
            setErro("Preencha os Critérios Avaliativos antes de avançar.");
            return;
        }

        setErro("");
        setEtapa(5);
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
            descritores: planoProfessor.descritores || [],
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

            <main className="editar-plano-page">
                <div className="box editar-plano-card">
                    <h1>E-plano</h1>

                    <div className="resumo-edicao">
                        <p><strong>Componente:</strong> {nomesComponentes[planoProfessor.componente] || planoProfessor.componente}</p>
                        <p><strong>Ano:</strong> {planoProfessor.ano}</p>
                        <p><strong>Período:</strong> {planoProfessor.periodo || "Não definido"}</p>
                    </div>

                    <div className="editar-plano-intro">
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
                                <h2>Descritores</h2>

                                <div className="turma-builder">
                                    <div className="turma-builder-grid escola-builder-grid">
                                        <div className="form-group">
                                            <label>Descritor</label>
                                            <div className="descritor-combobox">
                                                <button
                                                    type="button"
                                                    className={`descritor-select ${novoDescritor ? "tem-valor" : ""}`}
                                                    onClick={() => setDescritorAberto((aberto) => !aberto)}
                                                    onKeyDown={teclaDescritor}
                                                    aria-expanded={descritorAberto}
                                                    aria-controls="descritores-opcoes"
                                                >
                                                    <span>{novoDescritor || "Selecione o descritor"}</span>
                                                </button>

                                                {descritorAberto && (
                                                    <div id="descritores-opcoes" className="descritor-opcoes" role="listbox">
                                                        {filtroDescritor && (
                                                            <div className="descritor-filtro">Filtro: {filtroDescritor}</div>
                                                        )}

                                                        {descritoresFiltrados.length > 0 ? (
                                                            descritoresFiltrados.map((descritor) => (
                                                                <button
                                                                    key={descritor}
                                                                    type="button"
                                                                    className="descritor-opcao"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => selecionarDescritor(descritor)}
                                                                    role="option"
                                                                >
                                                                    {descritor}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="descritor-sem-opcoes">Nenhum descritor encontrado.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="turma-btn-area">
                                            <button
                                                type="button"
                                                className="btn-add-turma"
                                                onClick={adicionarDescritor}
                                            >
                                                <Plus size={18} />
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="turmas-selecionadas">
                                        {(planoProfessor.descritores || []).length > 0 ? (
                                            planoProfessor.descritores.map((descritor) => (
                                                <div key={descritor} className="turma-tag">
                                                    <span>{descritor}</span>
                                                    <button
                                                        type="button"
                                                        className="btn-remover-turma"
                                                        onClick={() => removerDescritor(descritor)}
                                                    >
                                                        <MinusCircle size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="turma-vazia">Nenhum descritor adicionado.</div>
                                        )}
                                    </div>
                                </div>

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
                                        className="btn btn-primary btn-etapa btn-right"
                                        onClick={validarEtapa1}
                                    >
                                        Próximo
                                        <CircleArrowRight color="#ffffff" size={22} />
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
                                        className="btn btn-info btn-etapa"
                                        onClick={() => setEtapa(1)}
                                    >
                                        <CircleArrowLeft color="#ffffff" size={22} />
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-etapa"
                                        onClick={() => setEtapa(3)}
                                    >
                                        Próximo
                                        <CircleArrowRight color="#ffffff" size={22} />
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
                                        className="btn btn-info btn-etapa"
                                        onClick={() => setEtapa(2)}
                                    >
                                        <CircleArrowLeft color="#ffffff" size={22} />
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-etapa"
                                        onClick={() => setEtapa(4)}
                                    >
                                        Próximo
                                        <CircleArrowRight color="#ffffff" size={22} />
                                    </button>
                                </div>
                            </>
                        )}

                        {etapa === 4 && (
                            <>
                                <h2>Critérios Avaliativos</h2>

                                <p>
                                    <strong>Habilidades selecionadas:</strong>{" "}
                                    {planoProfessor.habilidades?.length > 0
                                        ? planoProfessor.habilidades.join(", ")
                                        : "Nenhuma habilidade selecionada."}
                                </p>

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
                                        className="btn btn-info btn-etapa"
                                        onClick={() => setEtapa(3)}
                                    >
                                        <CircleArrowLeft color="#ffffff" size={22} />
                                        Anterior
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary btn-etapa"
                                        onClick={validarEtapa4}
                                    >
                                        Próximo
                                        <CircleArrowRight color="#ffffff" size={22} />
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
            </main>
        </>
    );
}
