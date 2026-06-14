import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarPlanoProfessor, buscarPlano, buscarProfessor, listarBNCC } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import "./visualizarProf.css";
import logoPlano from "./logo-plano.png";

export default function VisualizarPlanoProfessor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();

    const [loading, setLoading] = useState(true);
    const [salvandoPdf, setSalvandoPdf] = useState(false);
    const [imprimindoPdf, setImprimindoPdf] = useState(false);
    const [plano, setPlano] = useState(null);
    const [modelo, setModelo] = useState(null);
    const [professorDetalhe, setProfessorDetalhe] = useState(null);
    const [bncc, setBncc] = useState({});

    useEffect(() => {
        async function carregar() {
            try {
                const modeloData = await buscarPlano(id);
                const planoData = await buscarPlanoProfessor(usuario.id, id);
                const professorData = await buscarProfessor(usuario.id);

                setModelo(modeloData);
                setPlano(planoData);
                setProfessorDetalhe(professorData);

                const base = planoData || modeloData;

                if (base?.componente && base?.ano) {
                    const anoLimpo = String(base.ano).replace("º", "");
                    const bnccData = await listarBNCC(base.componente, anoLimpo);
                    setBncc(bnccData || {});
                }
            } catch (error) {
                console.error("Erro ao carregar plano:", error);
            } finally {
                setLoading(false);
            }
        }

        if (usuario?.id) {
            carregar();
        }
    }, [id, usuario]);

    const nomeComponente = {
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

    const componentesCH25 = [
        "lingua_portuguesa",
        "lp_leitura",
        "lp_producao_oralidade",
        "lp_analise_linguistica_e_Semiotica"
    ];

    const dados = plano || modelo || {};

    const chMensal = componentesCH25.includes(dados.componente) ? 25 : "-";

    const professorNome = (usuario?.nome || "-").toUpperCase();
    const emailProfessor = usuario?.email || "-";

    const componenteCurricular =
        nomeComponente[dados.componente] || dados.componente || "-";

    function normalizarTexto(valor) {
        return String(valor || "")
            .toLowerCase()
            .replace(/_/g, " ")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizarAno(valor) {
        const numero = String(valor || "").match(/\d+/)?.[0] || "";
        return numero.trim();
    }

    const escolasDocumento = (() => {
        const componentePlano = normalizarTexto(componenteCurricular);
        const anoPlano = normalizarAno(dados.ano);
        const escolasMap = new Map();

        (professorDetalhe?.atribuicoes || []).forEach((atribuicao) => {
            const componenteAtribuicao = normalizarTexto(atribuicao.componente_nome);
            const anoAtribuicao = normalizarAno(atribuicao.turma_ano || atribuicao.turma_nome);

            if (
                componenteAtribuicao === componentePlano &&
                anoAtribuicao === anoPlano &&
                atribuicao.escola_nome
            ) {
                escolasMap.set(atribuicao.escola_id || atribuicao.escola_nome, atribuicao.escola_nome);
            }
        });

        const escolas = Array.from(escolasMap.values());

        return escolas.length > 0
            ? escolas
            : [dados.escola || usuario?.escola || "Estabelecimento de Ensino"];
    })();

    const estabelecimento = escolasDocumento[0];

    function montarMapaHabilidades() {
        const mapa = {};

        Object.entries(bncc || {}).forEach(([_, objetos]) => {
            Object.entries(objetos || {}).forEach(([__, habilidades]) => {
                (habilidades || []).forEach((h) => {
                    mapa[h.codigo] = h.descricao;
                });
            });
        });

        return mapa;
    }

    const mapaHabilidades = montarMapaHabilidades();

    const habilidadesFormatadas =
        Array.isArray(dados.habilidades) && dados.habilidades.length > 0
            ? dados.habilidades.map((codigo) => ({
                  codigo,
                  descricao: mapaHabilidades[codigo] || codigo
              }))
            : [];

    function listaEmArray(lista) {
        return Array.isArray(lista) && lista.length > 0 ? lista : [];
    }

    const descritoresLista = listaEmArray(dados.descritores);
    const generosLista = listaEmArray(dados.generos);
    const objetosLista = listaEmArray(dados.objetos);
    const metodologiasLista = listaEmArray(dados.metodologias);
    const instrumentosLista = listaEmArray(dados.instrumentos);
    const recursosMetodologiaLista = listaEmArray(dados.metodologias_recursos);
    const recursosAvaliacaoLista = listaEmArray(dados.instrumentos_recursos);
    const tiposAvaliacaoLista = listaEmArray(dados.tipos_avaliacao);

    function voltarPagina() {
        navigate(-1);
    }

    function gerarNomeArquivoPdf() {
        return `plano_${componenteCurricular}_${dados.ano || ""}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "") || "plano_professor";
    }

    function gerarDocumentoPdf() {
        const pdf = new jsPDF("p", "mm", "a4");
        const paginaLargura = pdf.internal.pageSize.getWidth();
        const paginaAltura = pdf.internal.pageSize.getHeight();
        const margemX = 15;
        const margemTopo = 14;
        const margemRodape = 14;
        const larguraConteudo = paginaLargura - margemX * 2;
        const verde = [15, 118, 110];
        const cinzaBorda = [219, 231, 228];
        const textoEscuro = [31, 41, 55];
        const textoClaro = [100, 116, 139];
        let y = margemTopo;

        function textoSeguro(valor) {
            if (valor === null || valor === undefined || valor === "") return "-";
            return String(valor);
        }

        function novaPagina() {
            pdf.addPage();
            y = margemTopo;
        }

        function garantirEspaco(alturaNecessaria) {
            if (y + alturaNecessaria > paginaAltura - margemRodape) {
                novaPagina();
            }
        }

        function textoQuebrado(texto, largura) {
            return pdf.splitTextToSize(textoSeguro(texto), largura);
        }

        function adicionarTituloDocumento() {
            pdf.setFillColor(...verde);
            pdf.rect(margemX, y, larguraConteudo, 12, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(13);
            pdf.text("PLANO DE ATIVIDADE DOCENTE", paginaLargura / 2, y + 8, {
                align: "center"
            });
            y += 18;
        }

        function adicionarCampo(rotulo, valor) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            const linhas = textoQuebrado(`${rotulo}: ${textoSeguro(valor)}`, larguraConteudo - 8);
            const altura = Math.max(9, linhas.length * 4.6 + 5);

            garantirEspaco(altura);
            pdf.setDrawColor(...cinzaBorda);
            pdf.setFillColor(248, 251, 250);
            pdf.rect(margemX, y, larguraConteudo, altura, "FD");
            pdf.setTextColor(...textoEscuro);
            pdf.text(linhas, margemX + 4, y + 6);
            y += altura;
        }

        function adicionarCabecalho(escolaNome) {
            adicionarCampo("Estabelecimento de Ensino", escolaNome);
            adicionarCampo("Ano / Periodo / CH Mensal", `${dados.ano || "-"} / ${dados.periodo || "-"} / ${chMensal}`);
            adicionarCampo("Professor", professorNome);
            adicionarCampo("E-mail", emailProfessor);
            adicionarCampo("Componente Curricular", componenteCurricular);
            y += 8;
        }

        function adicionarSecao(titulo, itens) {
            const lista = Array.isArray(itens) && itens.length > 0 ? itens : ["-"];

            garantirEspaco(18);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10.5);
            pdf.setTextColor(...verde);
            pdf.text(titulo, margemX, y);
            y += 3;
            pdf.setDrawColor(...verde);
            pdf.setLineWidth(0.25);
            pdf.line(margemX, y, paginaLargura - margemX, y);
            y += 6;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(...textoEscuro);

            lista.forEach((item) => {
                const linhas = textoQuebrado(textoSeguro(item), larguraConteudo - 8);
                garantirEspaco(Math.min(linhas.length, 2) * 5 + 2);

                linhas.forEach((linha, index) => {
                    garantirEspaco(5);
                    if (index === 0 && item !== "-") {
                        pdf.text("•", margemX + 2, y);
                    }
                    pdf.text(linha, margemX + 7, y);
                    y += 5;
                });

                y += 1.5;
            });

            y += 4;
        }

        function adicionarAssinaturas() {
            const alturaBloco = 38;
            const espacoEntre = 10;
            const larguraAssinatura = (larguraConteudo - espacoEntre) / 2;
            const assinaturas = [
                "Professor(a)",
                "Coordenação Pedagógica"
            ];

            garantirEspaco(alturaBloco + 8);
            y += 4;

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10.5);
            pdf.setTextColor(...verde);
            pdf.text("ASSINATURAS", margemX, y);
            y += 24;

            assinaturas.forEach((assinatura, index) => {
                const x = margemX + index * (larguraAssinatura + espacoEntre);

                pdf.setDrawColor(100, 116, 139);
                pdf.setLineWidth(0.25);
                pdf.line(x, y, x + larguraAssinatura, y);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8.5);
                pdf.setTextColor(...textoClaro);
                pdf.text(assinatura, x + larguraAssinatura / 2, y + 5, {
                    align: "center"
                });
            });

            y += 14;
        }

        function adicionarRodapes() {
            const totalPaginas = pdf.getNumberOfPages();

            for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
                pdf.setPage(pagina);
                pdf.setDrawColor(...cinzaBorda);
                pdf.line(margemX, paginaAltura - 10, paginaLargura - margemX, paginaAltura - 10);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(...textoClaro);
                pdf.text(
                    `Página ${pagina} de ${totalPaginas}`,
                    paginaLargura / 2,
                    paginaAltura - 5,
                    { align: "center" }
                );
            }
        }

        escolasDocumento.forEach((escolaNome, index) => {
            if (index > 0) {
                novaPagina();
            }

            adicionarTituloDocumento();
            adicionarCabecalho(escolaNome);
            adicionarSecao("DESCRITORES", descritoresLista);
            adicionarSecao("CAMPO DE ATUAÇÃO", [dados.campo_atuacao || "-"]);
            adicionarSecao("PRÁTICAS DE LINGUAGEM", [componenteCurricular]);
            adicionarSecao("GÊNEROS SUGERIDOS", generosLista);
            adicionarSecao(
                "HABILIDADES",
                habilidadesFormatadas.map((item) => `(${item.codigo}) ${item.descricao}`)
            );
            adicionarSecao("OBJETOS DE CONHECIMENTO", objetosLista);
            adicionarSecao("METODOLOGIA", metodologiasLista);
            adicionarSecao("RECURSOS USADOS NA ABORDAGEM DO CONHECIMENTO", recursosMetodologiaLista);
            adicionarSecao("INSTRUMENTOS AVALIATIVOS", instrumentosLista);
            adicionarSecao("RECURSOS USADOS NA MENSURAÇÃO DA APRENDIZAGEM", recursosAvaliacaoLista);
            adicionarSecao("CRITÉRIOS AVALIATIVOS", tiposAvaliacaoLista);
            adicionarSecao("OBSERVAÇÕES", dados.observacoes ? [dados.observacoes] : []);
            adicionarAssinaturas();
        });

        adicionarRodapes();

        return pdf;
    }

    async function salvarPdf() {
        if (salvandoPdf) return;

        setSalvandoPdf(true);

        try {
            const pdf = gerarDocumentoPdf();
            pdf.save(`${gerarNomeArquivoPdf()}.pdf`);
        } catch (error) {
            console.error("Erro ao salvar PDF:", error);
            window.print();
        } finally {
            setSalvandoPdf(false);
        }
    }

    async function imprimirPlano() {
        if (imprimindoPdf) return;

        setImprimindoPdf(true);

        try {
            const pdf = gerarDocumentoPdf();
            pdf.autoPrint();

            const pdfUrl = pdf.output("bloburl");
            const janelaPdf = window.open(pdfUrl, "_blank");

            if (!janelaPdf) {
                pdf.save(`${gerarNomeArquivoPdf()}.pdf`);
            }
        } catch (error) {
            console.error("Erro ao imprimir PDF:", error);
            window.print();
        } finally {
            setImprimindoPdf(false);
        }
    }

    if (loading) {
        return <div style={{ padding: "30px" }}>Carregando...</div>;
    }

    if (!modelo) {
        return <div style={{ padding: "30px" }}>Modelo não encontrado.</div>;
    }

    return (
        <div className="visualizar-page">
            <div className="acoes-topo no-print">
                <button className="btn-topo btn-voltar" onClick={voltarPagina}>
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                </button>

                <button className="btn-topo btn-salvar" onClick={salvarPdf} disabled={salvandoPdf}>
                    <Download size={18} />
                    <span>{salvandoPdf ? "Salvando..." : "Salvar PDF"}</span>
                </button>

                <button className="btn-topo btn-imprimir" onClick={imprimirPlano} disabled={imprimindoPdf}>
                    <Printer size={18} />
                    <span>{imprimindoPdf ? "Abrindo..." : "Imprimir"}</span>
                </button>
            </div>

            <div className="a4-page">
                <div className="plano-doc">
                    <div className="topo-doc bloco-pequeno">
                        <div className="logo-central">
                            <img src={logoPlano} alt="Logo" />
                        </div>
                    </div>

                    <div className="cabecalho-d bloco-pequeno">
                        <div className="linha-cabecalho linha-unica">
                            <span className="rotulo">Estabelecimento de Ensino:</span>
                            <span className="valor">{estabelecimento}</span>
                        </div>

                        <div className="linha-cabecalho linha-tripla">
                            <div>
                                <span className="rotulo">Ano:</span>
                                <span className="valor">{dados.ano || "-"}</span>
                            </div>

                            <div>
                                <span className="rotulo">Período:</span>
                                <span className="valor">{dados.periodo || "-"}</span>
                            </div>

                            <div>
                                <span className="rotulo">CH (Mensal):</span>
                                <span className="valor">{chMensal}</span>
                            </div>
                        </div>

                        <div className="linha-cabecalho linha-dupla">
                            <div>
                                <span className="rotulo">Professor:</span>
                                <span className="valor">{professorNome}</span>
                            </div>

                            <div>
                                <span className="rotulo">E-mail:</span>
                                <span className="valor">{emailProfessor}</span>
                            </div>
                        </div>

                        <div className="linha-cabecalho linha-unica">
                            <span className="rotulo">Componente Curricular:</span>
                            <span className="valor">{componenteCurricular}</span>
                        </div>
                    </div>

                    <div className="quadro-plano">
                        <div className="quadro-titulo bloco-pequeno">
                            PLANO DE ATIVIDADE DOCENTE
                        </div>

                        <div className="quadro-linha bloco-pequeno">
                            <div className="bloco-destaque-doc">
                                <div className="linha-cabecalho linha-unica bloco-destaque-linha">
                                    <div className="bloco-coluna-unica">
                                        <div className="rotulo">Descritores</div>
                                        <div className="valor-bloco">
                                            {descritoresLista.length > 0 ? descritoresLista.join(", ") : "-"}
                                        </div>
                                    </div>
                                </div>

                                <div className="linha-cabecalho linha-dupla bloco-destaque-linha">
                                    <div>
                                        <div className="rotulo">Campo de Atuação</div>
                                        <div className="valor-bloco">{dados.campo_atuacao || "-"}</div>
                                    </div>

                                    <div>
                                        <div className="rotulo">Práticas de Linguagem</div>
                                        <div className="valor-bloco">{componenteCurricular}</div>
                                    </div>
                                </div>

                                <div className="linha-cabecalho linha-unica bloco-destaque-linha">
                                    <div className="bloco-coluna-unica">
                                        <div className="rotulo">Gêneros sugeridos</div>
                                        <div className="valor-bloco">
                                            {generosLista.length > 0 ? generosLista.join(", ") : "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">HABILIDADES</div>
                            <div className="campo-conteudo">
                                {habilidadesFormatadas.length > 0 ? (
                                    <div className="habilidades-lista">
                                        {habilidadesFormatadas.map((item, index) => (
                                            <div key={`${item.codigo}-${index}`} className="habilidade-item">
                                                <strong>({item.codigo})</strong> {item.descricao}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">OBJETOS DE CONHECIMENTO</div>
                            <div className="campo-conteudo">
                                {objetosLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {objetosLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">METODOLOGIA</div>
                            <div className="campo-conteudo">
                                {metodologiasLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {metodologiasLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">RECURSOS USADOS NA ABORDAGEM DO CONHECIMENTO</div>
                            <div className="campo-conteudo">
                                {recursosMetodologiaLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {recursosMetodologiaLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">INSTRUMENTOS AVALIATIVOS</div>
                            <div className="campo-conteudo">
                                {instrumentosLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {instrumentosLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">RECURSOS USADOS NA MENSURAÇÃO DA APRENDIZAGEM</div>
                            <div className="campo-conteudo">
                                {recursosAvaliacaoLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {recursosAvaliacaoLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">CRITÉRIOS AVALIATIVOS</div>
                            <div className="campo-conteudo">
                                {tiposAvaliacaoLista.length > 0 ? (
                                    <ul className="lista-bolinha">
                                        {tiposAvaliacaoLista.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha">
                            <div className="campo-topico">OBSERVAÇÕES</div>
                            <div className="campo-conteudo">
                                {dados.observacoes ? (
                                    <ul className="lista-bolinha">
                                        <li>{dados.observacoes}</li>
                                    </ul>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>

                        <div className="quadro-linha assinaturas-doc bloco-pequeno">
                            <div className="campo-topico">ASSINATURAS</div>

                            <div className="assinaturas-grid">
                                <div className="assinatura-item">
                                    <span>Professor(a)</span>
                                </div>

                                <div className="assinatura-item">
                                    <span>Coordenação Pedagógica</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
