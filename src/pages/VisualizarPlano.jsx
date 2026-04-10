import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { buscarPlano } from "../services/api";
import "./visualizar.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Printer } from "lucide-react";

export default function VisualizarPlano() {
  const { id } = useParams();

  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState(null);

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

  useEffect(() => {
    buscarPlano(id)
      .then((data) => setPlano(data))
      .catch(() => setErro("Plano não encontrado"));
  }, [id]);

  if (erro) return <p>{erro}</p>;
  if (!plano) return <p>Carregando...</p>;

  const habilidades = Array.isArray(plano.habilidades) ? plano.habilidades : [];
  const objetos = Array.isArray(plano.objetos) ? plano.objetos : [];
  const instrumentos = Array.isArray(plano.instrumentos) ? plano.instrumentos : [];
  const instrumentosRecursos = Array.isArray(plano.instrumentos_recursos) ? plano.instrumentos_recursos : [];
  const avaliacao = Array.isArray(plano.tipos_avaliacao) ? plano.tipos_avaliacao : [];
  const metodologias = Array.isArray(plano.metodologias) ? plano.metodologias : [];
  const metodologiasRecursos = Array.isArray(plano.metodologias_recursos) ? plano.metodologias_recursos : [];

  // 🔥 FUNÇÃO PARA GERAR PDF
  const gerarPDF = async () => {
    const elemento = document.querySelector(".documento");
    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`plano_${plano.componente}_${plano.ano}.pdf`);
  };

  return (
    <div className="documento-container">
      {/* BOTÃO PDF */}
      <button
        onClick={gerarPDF}
        style={{
          position: "fixed",

          bottom: "50px",
          right: "180px",
          zIndex: 9999,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
        }}
      >
        <Printer size={18} />
        Gerar PDF
      </button>

      <div className="documento">

        {/* CABEÇALHO */}
        <div className="cabecalho">
          <img src="/logo.png" alt="Logo" className="logo" />
          <h1>Modelo Plano Pedagógico</h1>
          <p>
            <strong>{nomesComponentes[plano.componente]}</strong> - {plano.ano}
          </p>
        </div>

        {/* TABELA */}
        <table className="tabela">
          <tbody>
            <tr>
              <td className="titulo">Habilidades da BNCC</td>
              <td className="conteudo">{habilidades.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Objetos de Conhecimento</td>
              <td className="conteudo">{objetos.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Instrumentos Avaliativos</td>
              <td className="conteudo">{instrumentos.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Recursos (Avaliação)</td>
              <td className="conteudo">{instrumentosRecursos.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Tipos de Avaliação</td>
              <td className="conteudo">{avaliacao.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Metodologias</td>
              <td className="conteudo">{metodologias.join("; ")}</td>
            </tr>
            <tr>
              <td className="titulo">Recursos (Metodologia)</td>
              <td className="conteudo">{metodologiasRecursos.join("; ")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}