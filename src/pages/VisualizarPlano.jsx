import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Pencil, Printer } from "lucide-react";
import jsPDF from "jspdf";
import { buscarPlano, listarBNCC } from "../services/api";
import "./visualizar.css";
import logoPlano from "./logo-plano.png";

const nomesComponentes = {
  lingua_portuguesa: "Lingua Portuguesa",
  lp_leitura: "LP - Leitura e Oralidade",
  lp_producao_oralidade: "LP - Producao de Texto-Oralidade",
  lp_analise_linguistica_e_Semiotica: "LP - Analise Linguistica e Semiotica",
  arte: "Arte",
  educacao_fisica: "Educacao Fisica",
  lingua_inglesa: "Lingua Inglesa",
  matematica: "Matematica",
  ciencias: "Ciencias",
  geografia: "Geografia",
  historia: "Historia",
  ensino_religioso: "Ensino Religioso",
  computacao: "Computacao"
};

const componentesCH25 = [
  "lingua_portuguesa",
  "lp_leitura",
  "lp_producao_oralidade",
  "lp_analise_linguistica_e_Semiotica"
];

function listaEmArray(valor) {
  return Array.isArray(valor) ? valor.filter(Boolean) : [];
}

function valorTexto(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  return String(valor);
}

function formatarStatus(valor) {
  const status = String(valor || "rascunho").replace(/_/g, " ");
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatarPeriodo(valor) {
  if (!valor) return "-";
  return `${String(valor).replace(/\D/g, "")}º`;
}

async function carregarImagemDataUrl(src) {
  try {
    const resposta = await fetch(src);
    const blob = await resposta.blob();

    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onloadend = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Erro ao carregar logo do PDF:", error);
    return "";
  }
}

export default function VisualizarPlano() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plano, setPlano] = useState(null);
  const [bncc, setBncc] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoPdf, setSalvandoPdf] = useState(false);
  const [imprimindoPdf, setImprimindoPdf] = useState(false);

  useEffect(() => {
    async function carregarPlano() {
      try {
        setLoading(true);
        setErro("");

        const dados = await buscarPlano(id);
        setPlano(dados);

        if (dados?.componente && dados?.ano) {
          const anoLimpo = String(dados.ano).replace(/\D/g, "");
          const dadosBncc = await listarBNCC(dados.componente, anoLimpo);
          setBncc(dadosBncc || {});
        }
      } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        setErro("Modelo nao encontrado.");
      } finally {
        setLoading(false);
      }
    }

    carregarPlano();
  }, [id]);

  const mapaHabilidades = useMemo(() => {
    const mapa = {};

    Object.values(bncc || {}).forEach((objetos) => {
      Object.values(objetos || {}).forEach((habilidades) => {
        (habilidades || []).forEach((habilidade) => {
          mapa[habilidade.codigo] = habilidade.descricao;
        });
      });
    });

    return mapa;
  }, [bncc]);

  const componenteCurricular = nomesComponentes[plano?.componente] || plano?.componente || "-";
  const chMensal = componentesCH25.includes(plano?.componente) ? "25" : "-";
  const habilidades = listaEmArray(plano?.habilidades).map((codigo) => ({
    codigo,
    descricao: mapaHabilidades[codigo] || codigo
  }));
  const objetos = listaEmArray(plano?.objetos);
  const instrumentos = listaEmArray(plano?.instrumentos);
  const recursosAvaliacao = listaEmArray(plano?.instrumentos_recursos);
  const criteriosAvaliativos = listaEmArray(plano?.tipos_avaliacao);
  const metodologias = listaEmArray(plano?.metodologias);
  const recursosMetodologia = listaEmArray(plano?.metodologias_recursos);
  const generos = listaEmArray(plano?.generos);
  const descritores = listaEmArray(plano?.descritores);

  function gerarNomeArquivoPdf() {
    return `modelo_${componenteCurricular}_${plano?.ano || ""}_${plano?.periodo || ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "modelo_plano";
  }

  function gerarDocumentoPdf(logoDataUrl) {
    const pdf = new jsPDF("p", "mm", "a4");
    const larguraPagina = pdf.internal.pageSize.getWidth();
    const alturaPagina = pdf.internal.pageSize.getHeight();
    const margemX = 15;
    const margemTopo = 14;
    const margemRodape = 14;
    const larguraConteudo = larguraPagina - margemX * 2;
    const verde = [15, 118, 110];
    const cinzaBorda = [219, 231, 228];
    const textoEscuro = [31, 41, 55];
    const textoClaro = [100, 116, 139];
    let y = margemTopo;

    function novaPagina() {
      pdf.addPage();
      y = margemTopo;
    }

    function garantirEspaco(alturaNecessaria) {
      if (y + alturaNecessaria > alturaPagina - margemRodape) {
        novaPagina();
      }
    }

    function textoQuebrado(texto, largura) {
      return pdf.splitTextToSize(valorTexto(texto), largura);
    }

    function adicionarTopoModelo() {
      const topoY = y;
      const alturaCabecalho = 40;
      const alturaResumo = 25;
      const alturaTotal = alturaCabecalho + alturaResumo;
      const colunas = [
        ["ANO", valorTexto(plano?.ano)],
        ["PERIODO", formatarPeriodo(plano?.periodo)],
        ["CH MENSAL", chMensal],
        ["STATUS", formatarStatus(plano?.status)],
        ["ENVIO", formatarStatus(plano?.envio_status || "nao enviado")]
      ];
      const larguraColuna = larguraConteudo / colunas.length;

      pdf.setDrawColor(...cinzaBorda);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margemX, topoY, larguraConteudo, alturaTotal, 2, 2, "FD");

      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, "PNG", margemX + 5, topoY + 15, 30, 12);
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...verde);
      pdf.text("MODELO DO COORDENADOR", margemX + 40, topoY + 11);

      pdf.setFontSize(18);
      pdf.setTextColor(2, 6, 23);
      pdf.text("Modelo de Plano Pedagogico", margemX + 40, topoY + 22);

      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(componenteCurricular, margemX + 40, topoY + 32);

      pdf.setDrawColor(...cinzaBorda);
      pdf.line(margemX, topoY + alturaCabecalho, margemX + larguraConteudo, topoY + alturaCabecalho);

      colunas.forEach(([rotulo, valor], index) => {
        const x = margemX + larguraColuna * index;

        if (index > 0) {
          pdf.line(x, topoY + alturaCabecalho, x, topoY + alturaTotal);
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...verde);
        pdf.text(rotulo, x + 4, topoY + alturaCabecalho + 8.5);

        pdf.setFontSize(11);
        pdf.setTextColor(2, 6, 23);
        pdf.text(valorTexto(valor), x + 4, topoY + alturaCabecalho + 18);
      });

      y += alturaTotal + 9;
    }

    function adicionarTituloDocumento(titulo) {
      garantirEspaco(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...textoEscuro);
      pdf.text(titulo, margemX, y);
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
      pdf.line(margemX, y, larguraPagina - margemX, y);
      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...textoEscuro);

      lista.forEach((item) => {
        const linhas = textoQuebrado(item, larguraConteudo - 8);

        linhas.forEach((linha, index) => {
          garantirEspaco(5);
          if (index === 0 && item !== "-") {
            pdf.text("-", margemX + 2, y);
          }
          pdf.text(linha, margemX + 7, y);
          y += 5;
        });

        y += 1.5;
      });

      y += 4;
    }

    function adicionarRodapes() {
      const totalPaginas = pdf.getNumberOfPages();

      for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
        pdf.setPage(pagina);
        pdf.setDrawColor(...cinzaBorda);
        pdf.line(margemX, alturaPagina - 10, larguraPagina - margemX, alturaPagina - 10);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...textoClaro);
        pdf.text(`Pagina ${pagina} de ${totalPaginas}`, larguraPagina / 2, alturaPagina - 5, {
          align: "center"
        });
      }
    }

    adicionarTopoModelo();
    adicionarTituloDocumento("Detalhamento do modelo");

    adicionarSecao("DESCRITORES", descritores);
    adicionarSecao("CAMPO DE ATUACAO", [plano?.campo_atuacao || "-"]);
    adicionarSecao("GENEROS SUGERIDOS", generos);
    adicionarSecao("HABILIDADES", habilidades.map((item) => `(${item.codigo}) ${item.descricao}`));
    adicionarSecao("OBJETOS DE CONHECIMENTO", objetos);
    adicionarSecao("METODOLOGIA", metodologias);
    adicionarSecao("RECURSOS DA METODOLOGIA", recursosMetodologia);
    adicionarSecao("INSTRUMENTOS AVALIATIVOS", instrumentos);
    adicionarSecao("RECURSOS DA AVALIACAO", recursosAvaliacao);
    adicionarSecao("CRITERIOS AVALIATIVOS", criteriosAvaliativos);

    adicionarRodapes();
    return pdf;
  }

  async function salvarPdf() {
    if (salvandoPdf || !plano) return;

    setSalvandoPdf(true);

    try {
      const logoDataUrl = await carregarImagemDataUrl(logoPlano);
      gerarDocumentoPdf(logoDataUrl).save(`${gerarNomeArquivoPdf()}.pdf`);
    } catch (error) {
      console.error("Erro ao salvar PDF:", error);
      window.print();
    } finally {
      setSalvandoPdf(false);
    }
  }

  async function imprimirPlano() {
    if (imprimindoPdf || !plano) return;

    setImprimindoPdf(true);

    try {
      const logoDataUrl = await carregarImagemDataUrl(logoPlano);
      const pdf = gerarDocumentoPdf(logoDataUrl);
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

  function renderLista(itens) {
    if (!itens.length) return <span className="valor-vazio">-</span>;

    return (
      <ul className="modelo-lista">
        {itens.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  }

  if (loading) {
    return <div className="visualizar-modelo-page estado-visualizacao">Carregando modelo...</div>;
  }

  if (erro || !plano) {
    return <div className="visualizar-modelo-page estado-visualizacao">{erro || "Modelo nao encontrado."}</div>;
  }

  return (
    <div className="visualizar-modelo-page">
      <div className="modelo-acoes-topo no-print">
        <button className="modelo-btn modelo-btn-secundario" onClick={() => navigate("/planos")}>
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>

        <button className="modelo-btn modelo-btn-secundario" onClick={() => navigate(`/editar/${id}`)}>
          <Pencil size={18} />
          <span>Editar</span>
        </button>

        <button className="modelo-btn modelo-btn-primario" onClick={salvarPdf} disabled={salvandoPdf}>
          <Download size={18} />
          <span>{salvandoPdf ? "Salvando..." : "Salvar PDF"}</span>
        </button>

        <button className="modelo-btn modelo-btn-primario" onClick={imprimirPlano} disabled={imprimindoPdf}>
          <Printer size={18} />
          <span>{imprimindoPdf ? "Abrindo..." : "Imprimir"}</span>
        </button>
      </div>

      <article className="modelo-documento">
        <header className="modelo-cabecalho">
          <img src={logoPlano} alt="Logo do plano" />
          <div>
            <span className="modelo-kicker">Modelo do coordenador</span>
            <h1>Modelo de Plano Pedagogico</h1>
            <p>{componenteCurricular}</p>
          </div>
        </header>

        <section className="modelo-resumo">
          <div>
            <span>Ano</span>
            <strong>{valorTexto(plano.ano)}</strong>
          </div>
          <div>
            <span>Periodo</span>
            <strong>{formatarPeriodo(plano.periodo)}</strong>
          </div>
          <div>
            <span>CH mensal</span>
            <strong>{chMensal}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{formatarStatus(plano.status)}</strong>
          </div>
          <div>
            <span>Envio</span>
            <strong>{formatarStatus(plano.envio_status || "nao enviado")}</strong>
          </div>
        </section>

        {(descritores.length > 0 || plano.campo_atuacao || generos.length > 0) && (
          <section className="modelo-bloco">
            <h2>Dados pedagogicos complementares</h2>
            <div className="modelo-grid-dupla">
              <div>
                <h3>Descritores</h3>
                {renderLista(descritores)}
              </div>
              <div>
                <h3>Campo de atuacao</h3>
                <p>{plano.campo_atuacao || "-"}</p>
              </div>
              <div className="modelo-grid-largo">
                <h3>Generos sugeridos</h3>
                {renderLista(generos)}
              </div>
            </div>
          </section>
        )}

        <section className="modelo-bloco">
          <h2>Habilidades</h2>
          {habilidades.length > 0 ? (
            <div className="modelo-habilidades">
              {habilidades.map((item, index) => (
                <div key={`${item.codigo}-${index}`} className="modelo-habilidade-item">
                  <strong>{item.codigo}</strong>
                  <span>{item.descricao}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="valor-vazio">-</span>
          )}
        </section>

        <section className="modelo-bloco">
          <h2>Objetos de conhecimento</h2>
          {renderLista(objetos)}
        </section>

        <section className="modelo-grid-secoes">
          <div className="modelo-bloco">
            <h2>Avaliacao</h2>
            <h3>Instrumentos avaliativos</h3>
            {renderLista(instrumentos)}
            <h3>Recursos usados na mensuracao da aprendizagem</h3>
            {renderLista(recursosAvaliacao)}
            <h3>Criterios avaliativos</h3>
            {renderLista(criteriosAvaliativos)}
          </div>

          <div className="modelo-bloco">
            <h2>Metodologia</h2>
            <h3>Metodologias</h3>
            {renderLista(metodologias)}
            <h3>Recursos usados na abordagem do conhecimento</h3>
            {renderLista(recursosMetodologia)}
          </div>
        </section>
      </article>
    </div>
  );
}
