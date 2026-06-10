import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "./Toast";
import { Save, CopyCheck, CopyX } from "lucide-react";

export default function EditarPlano() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [bncc, setBncc] = useState({});
  const [form, setForm] = useState({
    componente: "",
    ano: "",
    periodo: "",
    habilidades: [],
    objetos: [],
    metodologias: [],
    metodologias_recursos: [],
    instrumentos: [],
    instrumentos_recursos: [],
    tipos_avaliacao: []
  });

  const limparPeriodo = (p) => {
    try {
      let valor = p;
      while (typeof valor === "string" && (valor.startsWith('"') || valor.startsWith("["))) {
        valor = JSON.parse(valor);
      }
      if (Array.isArray(valor)) return valor[0];
      return valor;
    } catch {
      return p;
    }
  };

  const formatPeriodo = (p) => {
    if (!p) return "Não definido";
    return `${p}º`; // 1 -> 1º, 2 -> 2º...
  };

  // 🔥 CARREGAR DADOS DO PLANO
  useEffect(() => {
    fetch(`http://localhost:3000/planos/${id}`)
      .then(res => res.json())
      .then(data => {
        setForm({
          ...data,
          periodo: limparPeriodo(data.periodo || ""),
          habilidades: data.habilidades || []
        });
      });
  }, [id]);

  // 🔥 CARREGAR BNCC
  useEffect(() => {
    if (form.componente && form.ano) {
      fetch(`http://localhost:3000/bncc/${form.componente}/${form.ano.replace("º", "")}`)
        .then(res => res.json())
        .then(setBncc);
    }
  }, [form.componente, form.ano]);

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  };

  const handleArrayChange = (campo, valor) => {
    setForm(prev => {
      const lista = prev[campo] || [];
      if (lista.includes(valor)) {
        return { ...prev, [campo]: lista.filter(v => v !== valor) };
      } else {
        return { ...prev, [campo]: [...lista, valor] };
      }
    });
  };

  const selecionarTodasHabilidades = () => {
    const todas = [];
    Object.entries(bncc).forEach(([u, objs]) => {
      Object.entries(objs).forEach(([o, habs]) => {
        habs.forEach(h => todas.push(h.codigo));
      });
    });
    setForm(prev => ({ ...prev, habilidades: todas }));
  };

  const [popup, setPopup] = useState({ show: false, mensagem: "", tipo: "" });

  const handleSubmit = async () => {
    const dadosLimpos = { ...form };

    await fetch(`http://localhost:3000/planos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosLimpos)
    });

    // exibe toast
    setPopup({
      show: true,
      mensagem: "Plano editado com sucesso!",
      tipo: "sucesso"
    });

    // fecha toast e navega após 1.5s
    setTimeout(() => {
      setPopup({ show: false, mensagem: "", tipo: "" });
      navigate("/planos");
    }, 1500);
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
        )}

      <div className="box">

        {/* 🔹 RESUMO DO PLANO */}
        <div className=" sticky-summary">
          <h2>Resumo do Plano</h2>
          <p><b>Componente:</b> {form.componente}</p>
          <p><b>Ano:</b> {form.ano}</p>
          <p><b>Período:</b> {formatPeriodo(form.periodo)}</p>
        </div>

        {/* 🔹 FORMULÁRIO */}
        <div className="">

          {/* 🔹 HABILIDADES */}
          <h3>Habilidades</h3>
          <input
            placeholder="Buscar habilidade..."
            onChange={(e) => handleChange("busca", e.target.value)}
          />
          <div className="habilidades-container">
            {Object.entries(bncc).map(([unidade, objs]) => (
              <div key={unidade} className="unidade-bloco">
                <h4>{unidade}</h4>
                <div className="habilidades-lista">
                  {Object.entries(objs).map(([objeto, habs]) =>
                    habs
                      .filter(h => !form.busca || h.descricao.toLowerCase().includes(form.busca.toLowerCase()))
                      .map(h => (
                        <label key={h.codigo} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={form.habilidades?.includes(h.codigo)}
                            onChange={() => handleArrayChange("habilidades", h.codigo)}
                          />
                          {h.codigo} - {h.descricao}
                        </label>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-success" onClick={selecionarTodasHabilidades}><CopyCheck color="#ffff" size={15}/>Selecionar todos </button>
          <button className="btn btn-danger" onClick={() => setForm(prev => ({ ...prev, habilidades: [] }))}><CopyX color="#ffff" size={15}/>Desmarcar</button>

          {/* 🔹 INSTRUMENTOS */}
          <h3>Instrumentos Avaliativos</h3>
          {["Prova objetiva de múltipla-escolha", "Prova oral", "Prova discursiva", "Vistos em caderno", "Observação"].map(item => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.instrumentos?.includes(item)}
                onChange={() => handleArrayChange("instrumentos", item)}
              />
              {item}
            </label>
          ))}
          

          {/* 🔹 RECURSOS INSTRUMENTOS */}
          <h4>Recursos (Mensuração)</h4>
          {["Escrita no quadro", "Impressão em folha", "Livro didático", "Ditada", "Projeção da atividade", "Jogos", "Links"].map(item => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.instrumentos_recursos?.includes(item)}
                onChange={() => handleArrayChange("instrumentos_recursos", item)}
              />
              {item}
            </label>
          ))}

          {/* 🔹 TIPOS DE AVALIAÇÃO */}
          <h3>Tipos de Avaliação</h3>
          {["D1", "D2", "D3", "D4"].map(item => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.tipos_avaliacao?.includes(item)}
                onChange={() => handleArrayChange("tipos_avaliacao", item)}
              />
              {item}
            </label>
          ))}

          {/* 🔹 METODOLOGIAS */}
          <h3>Metodologias</h3>
          {["Expositiva ou instrucional", "Seminário", "Debate", "Sala de aula invertida", "Gamificação", "Ensino Hibrido", "Design Thinking", "STEAM", "Cultura Maker"].map(item => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.metodologias?.includes(item)}
                onChange={() => handleArrayChange("metodologias", item)}
              />
              {item}
            </label>
          ))}

          {/* 🔹 RECURSOS METODOLOGIAS */}
          <h4>Recursos (Metodologias)</h4>
          {["Caixa amplificada", "Escrita no quadro", "Projeção de aula", "Impressão em folha", "Livro didático", "Jogos", "Vídeos", "Materiais concretos", "Áudios", "Cartazes", "Pesquisas na internet"].map(item => (
            <label key={item} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.metodologias_recursos?.includes(item)}
                onChange={() => handleArrayChange("metodologias_recursos", item)}
              />
              {item}
            </label>
          ))}

          <br /><br />
          <button className="btn btn-primary btn-right" onClick={handleSubmit}>
            <Save color="#ffff" size={20} />
            SALVAR
          </button>
        </div>

      </div>
    </>
  );
}
