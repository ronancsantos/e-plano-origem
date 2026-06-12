import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarPlanoProfessor, buscarPlano, listarBNCC } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./visualizarProf.css";

export default function VisualizarPlanoProfessor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const documentoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [salvandoPdf, setSalvandoPdf] = useState(false);
    const [plano, setPlano] = useState(null);
    const [modelo, setModelo] = useState(null);
    const [bncc, setBncc] = useState({});

    useEffect(() => {
        async function carregar() {
            try {
                const modeloData = await buscarPlano(id);
                const planoData = await buscarPlanoProfessor(usuario.id, id);

                setModelo(modeloData);
                setPlano(planoData);

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
        lp_leitura_e_oralidade: "LP - Leitura e Oralidade",
        lp_producao_de_texto_e_oralidade: "LP - Produção de Texto e Oralidade",
        lp_analise_linguistica_e_semiotica: "LP - Análise Linguística e Semiótica",
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
        "lp_leitura_e_oralidade",
        "lp_producao_de_texto_e_oralidade",
        "lp_analise_linguistica_e_semiotica"
    ];

    const dados = plano || modelo || {};

    const chMensal = componentesCH25.includes(dados.componente) ? 25 : "-";

    const estabelecimento =
        dados.escola ||
        usuario?.escola ||
        "Estabelecimento de Ensino";

    const professorNome = (usuario?.nome || "-").toUpperCase();
    const emailProfessor = usuario?.email || "-";

    const componenteCurricular =
        nomeComponente[dados.componente] || dados.componente || "-";

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

    function imprimirPlano() {
        window.print();
    }

    async function salvarPdf() {
        if (!documentoRef.current || salvandoPdf) return;

        setSalvandoPdf(true);

        try {
            const canvas = await html2canvas(documentoRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const nomeArquivo = `plano_${componenteCurricular}_${dados.ano || ""}`
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");

            pdf.save(`${nomeArquivo || "plano_professor"}.pdf`);
        } catch (error) {
            console.error("Erro ao salvar PDF:", error);
            window.print();
        } finally {
            setSalvandoPdf(false);
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

                <button className="btn-topo btn-imprimir" onClick={imprimirPlano}>
                    <Printer size={18} />
                    <span>Imprimir</span>
                </button>
            </div>

            <div className="a4-page">
                <div className="plano-doc" ref={documentoRef}>
                    <div className="topo-doc bloco-pequeno">
                        <div className="logo-central">
                            <img src="/logo.png" alt="Logo" />
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
                    </div>
                </div>
            </div>
        </div>
    );
}
