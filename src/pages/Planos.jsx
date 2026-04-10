import { useEffect, useState } from "react";
import { listarPlanos, deletarPlano, enviarModeloPlano } from "../services/api";
import { Eye, Pencil, Trash2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./planos.css";
import Toast from "./Toast";
import { useAuth } from "../context/AuthContext";

export default function Planos() {

  async function handleEnviarModelo(id) {
    const confirmar = window.confirm("Deseja enviar este modelo para os professores?");
    if (!confirmar) return;

    try {
      const resposta = await enviarModeloPlano(id);

      if (resposta.error || resposta.erro) {
        alert(resposta.error || resposta.erro);
        return;
      }

      setPopup({
        show: true,
        mensagem: "Modelo enviado com sucesso!",
        tipo: "sucesso"
      });

      await carregar();

      setTimeout(() => {
        setPopup({ show: false, mensagem: "", tipo: "" });
      }, 2000);
    } catch (error) {
      console.error("Erro ao enviar modelo:", error);
      setPopup({
        show: true,
        mensagem: "Erro ao enviar modelo.",
        tipo: "erro"
      });
    }
  }

  const [planos, setPlanos] = useState([]);

  // Lista de períodos com value e label
  const nomePeriodo = [
    { value: "1", label: "1º" },
    { value: "2", label: "2º" },
    { value: "3", label: "3º" },
    { value: "4", label: "4º" },
  ];

  const [confirmarDelete, setConfirmarDelete] = useState(null);
  const [popup, setPopup] = useState({ show: false, mensagem: "", tipo: "" });


  // Função para limpar valores de período vindos do banco
  const limparPeriodo = (p) => {
    try {
      let valor = p;
      while (typeof valor === "string" && (valor.startsWith('"') || valor.startsWith("["))) {
        valor = JSON.parse(valor);
      }

      // Se for array, pega o primeiro elemento
      if (Array.isArray(valor)) valor = valor[0];

      // Normaliza para valores "1", "2", "3", "4"
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

  const carregar = async () => {
    const data = await listarPlanos();
    // normaliza o período de cada plano
    const dataNormalizada = data.map(p => ({
      ...p,
      periodo: limparPeriodo(p.periodo),
      envio_status: p.envio_status || "nao_enviado"
    }));
    setPlanos(dataNormalizada);
  };

  useEffect(() => {
    carregar();
  }, []);

  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate("/login");
  }

  const handleDelete = async () => {
    try {
      if (!confirmarDelete) return;

      await deletarPlano(confirmarDelete);

      setConfirmarDelete(null);
      await carregar();

      setPopup({
        show: true,
        mensagem: "Modelo de Plano apagado com sucesso!",
        tipo: "sucesso"
      });

      setTimeout(() => {
        setPopup({ show: false, mensagem: "", tipo: "" });
      }, 2000);

    } catch (err) {
      console.error(err);
      setPopup({
        show: true,
        mensagem: "Erro ao apagar plano",
        tipo: "erro"
      });
    }
  };


  return (

    <>
      {
        popup.show && (
          <Toast
            key={popup.mensagem}
            mensagem={popup.mensagem}
            tipo={popup.tipo}
            onClose={() => setPopup({ show: false, mensagem: "", tipo: "" })}
          />
        )
      }

      {
        confirmarDelete && (
          <div className="modal-overlay">
            <div className="modal-confirm">
              <h3>ATENÇÃO</h3>
              <p>Deseja realmente apagar este plano?</p>

              <div className="modal-acoes">
                <button className="btn btn-danger" onClick={handleDelete}>
                  Sim, apagar
                </button>
                <button className="btn btn-info" onClick={() => setConfirmarDelete(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }
      <div className="planos-container">
        <div className="topo">
          <h1>Planos</h1>
          <p>Olá, {usuario?.nome}</p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={sair}>Sair</button>
          </div>

          <button className="btn-novo" onClick={() => navigate("/coordenador")}>
            Novo Plano
          </button>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Componente</th>
                <th>Ano</th>
                <th>Período</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {planos.map((p) => (
                <tr key={p.id}>
                  <td>{nomesComponentes[p.componente] || p.componente}</td>
                  <td>{p.ano}</td>
                  <td>
                    {nomePeriodo.find((np) => np.value === String(p.periodo))?.label || ""}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "#2ecc71",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      >
                        {p.status || "concluido"}
                      </span>

                      <span
                        style={{
                          background:
                            p.envio_status === "enviado"
                              ? "#3498db"
                              : p.envio_status === "substituido"
                                ? "#f39c12"
                                : "#bdc3c7",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      >
                        {p.envio_status === "enviado"
                          ? "Enviado"
                          : p.envio_status === "substituido"
                            ? "Substituído"
                            : "Não enviado"}
                      </span>
                    </div>
                  </td>

                  <td className="acoes">
                    <button onClick={() => navigate(`/visualizar/${p.id}`)}>
                      <Eye size={25} />
                    </button>

                    <button onClick={() => navigate(`/editar/${p.id}`)}>
                      <Pencil size={25} />
                    </button>
                    <button
                      onClick={() => handleEnviarModelo(p.id)}
                      title="Enviar modelo"
                    >
                      <Send size={25} />
                    </button>

                    <button onClick={() => setConfirmarDelete(p.id)}>
                      <Trash2 size={25} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}