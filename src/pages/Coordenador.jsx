import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  salvarPlano,
  listarBNCC,
  buscarPlano,
  atualizarPlano
} from "../services/api";
import "./coordenador.css";
import { ChevronRight, CircleArrowRight, CircleArrowLeft, Layers3, CircleAlert, CopyCheck, CopyX } from "lucide-react";
import Toast from "./Toast";

export default function Coordenador() {
  const [etapa, setEtapa] = useState(1);
  const [bncc, setBncc] = useState({});
  const [busca, setBusca] = useState("");
  const [popup, setPopup] = useState({ show: false, mensagem: "", tipo: "" });

  const selecionarTodos = (campo, lista) => {
    setModelo({ ...modelo, [campo]: lista });
  };

  const navigate = useNavigate();
  const { id } = useParams();

  const [modelo, setModelo] = useState({
    componente: "",
    ano: "",
    periodo: "",
    habilidades: [],
    objetos: [],
    instrumentos: [],
    recursosAvaliacao: [],
    avaliacao: [],
    metodologias: [],
    recursosMetodologia: [],
    status: "rascunho"
  });

  const mostrarPopup = (mensagem, tipo) => {
    setPopup({ show: true, mensagem, tipo });
    setTimeout(() => {
      setPopup({ show: false, mensagem: "", tipo: "" });
      if (tipo === "sucesso") navigate("/planos");
    }, 2500);
  };

  const componentes = [
    { value: "lingua_portuguesa", label: "Língua Portuguesa" },
    { value: "lp_leitura", label: "LP - Leitura e Oralidade"},
    { value: "lp_producao_oralidade", label: "LP - Produção de Texto-Oralidade"},
    { value: "lp_analise_linguistica_e_Semiotica", label: "LP - Análise Linguística e Semiótica"},
    { value: "arte", label: "Arte" },
    { value: "educacao_fisica", label: "Educação Física" },
    { value: "lingua_inglesa", label: "Língua Inglesa" },
    { value: "matematica", label: "Matemática" },
    { value: "ciencias", label: "Ciências" },
    { value: "geografia", label: "Geografia" },
    { value: "historia", label: "História" },
    { value: "ensino_religioso", label: "Ensino Religioso" },
    { value: "computacao", label: "Computação" }
  ];

  const anos = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º"];

  /* ARRAYS DE SELEÇÃO */
  const opcoesInstrumentos = [
    "Prova objetiva de múltipla-escolha",
    "Prova oral",
    "Prova discursiva",
    "Vistos em caderno",
    "Observação"
  ];

  const recursosAvaliacao = ["Escrita no quadro",
    "Impressão em folha",
    "Livro didático",
    "Ditada",
    "Projeção da atividade",
    "Jogos",
    "Links"
  ];

  const recursosMetodologia = [
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
    "Smart TV"
  ];
  const metodologias = [
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
    "Sala de Redação Investigativa"
  ];

  useEffect(() => {
    if (modelo.componente && modelo.ano) {
      listarBNCC(modelo.componente, String(modelo.ano).replace(/\D/g, "")).then(setBncc);
    }
  }, [modelo.componente, modelo.ano]);

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

  useEffect(() => {
    if (id) {
      buscarPlano(id).then((data) => {
        setModelo((prev) => ({
          ...prev,
          ...data,
          periodo: limparPeriodo(data.periodo) || "",
          habilidades: data.habilidades || [],
          objetos: data.objetos || [],
          instrumentos: data.instrumentos || [],
          recursosAvaliacao: data.instrumentos_recursos || [],
          metodologias: data.metodologias || [],
          recursosMetodologia: data.metodologias_recursos || [],
          avaliacao: data.tipos_avaliacao || [],
          status: data.status || "rascunho"
        }));
        setEtapa(2);
      });
    }
  }, [id]);

  const toggle = (campo, valor) => {
    let lista = [...modelo[campo]];
    if (lista.includes(valor)) {
      lista = lista.filter((i) => i !== valor);
    } else {
      lista.push(valor);
    }
    setModelo({ ...modelo, [campo]: lista });
  };

  const selecionarTodasHabilidades = () => {
    let todas = [];
    Object.values(bncc).forEach((objs) => {
      Object.values(objs).forEach((habs) => {
        habs.forEach((h) => todas.push(h.codigo));
      });
    });
    setModelo({ ...modelo, habilidades: todas });
  };

  const objetosFiltrados = () => {
    let objs = [];
    Object.entries(bncc).forEach(([_, objetos]) => {
      Object.entries(objetos).forEach(([objNome, habilidades]) => {
        habilidades.forEach((h) => {
          if (modelo.habilidades.includes(h.codigo)) {
            objs.push(objNome);
          }
        });
      });
    });
    return [...new Set(objs)];
  };

  useEffect(() => {
    if (etapa !== 3) return;

    const objetos = objetosFiltrados();
    const mesmosObjetos =
      objetos.length === modelo.objetos.length &&
      objetos.every((objeto) => modelo.objetos.includes(objeto));

    if (!mesmosObjetos) {
      setModelo((prev) => ({ ...prev, objetos }));
    }
  }, [etapa, modelo.habilidades, bncc]);

  const normalizarTextoBusca = (valor) =>
    String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const habilidadeCombinaBusca = (habilidade) => {
    const termo = normalizarTextoBusca(busca.trim());
    if (!termo) return true;

    return [habilidade.codigo, habilidade.descricao].some((valor) =>
      normalizarTextoBusca(valor).includes(termo)
    );
  };

  const habilidadesFiltradas = [
    ...new Map(
      Object.values(bncc)
        .flatMap((objetos) => Object.values(objetos))
        .flat()
        .filter(habilidadeCombinaBusca)
        .map((habilidade) => [habilidade.codigo, habilidade])
    ).values()
  ];

  const handleSalvar = async () => {
    if (!etapaCompleta(5)) {
      setPopup({
        show: true,
        mensagem: mensagemEtapa(5),
        tipo: "erro"
      });
      return;
    }

    if (!modelo.periodo) {
      mostrarPopup("Selecione o período", "erro");
      return;
    }

    const dados = {
      ...modelo,
      periodo: limparPeriodo(modelo.periodo) || "",
      instrumentos_recursos: modelo.recursosAvaliacao,
      metodologias_recursos: modelo.recursosMetodologia,
      tipos_avaliacao: modelo.avaliacao,
      status: "concluido"
    };
    

    try {
      if (id) {
        await atualizarPlano(id, dados);
      } else {
        console.log("Plano enviado:", modelo);
        await salvarPlano(dados);
      }

      setPopup({ show: true, mensagem: "Plano cadastrado com sucesso!", tipo: "sucesso" });

      setTimeout(() => {
        navigate("/planos");
      }, 3000);


    } catch {
      setPopup({ show: true, mensagem: "Erro ao criar plano", tipo: "erro" });
    }
  };

  const validarEtapa1 = () => {
    const campos = [
      { key: "componente", label: "Componente" },
      { key: "ano", label: "Ano" },
      { key: "periodo", label: "Período" },
    ];

    for (let campo of campos) {
      if (!modelo[campo.key]) {
        setPopup({
          show: true,
          mensagem: `Preencha o campo ${campo.label}.`,
          tipo: "erro"
        });
        return;
      }
    }

    setEtapa(2);
  };

  const etapasPlano = [
    { numero: 1, label: "Dados iniciais" },
    { numero: 2, label: "Habilidades" },
    { numero: 3, label: "Objetos" },
    { numero: 4, label: "Avaliação" },
    { numero: 5, label: "Metodologia" }
  ];

  const etapaCompleta = (numero) => {
    if (numero === 1) return Boolean(modelo.componente && modelo.ano && modelo.periodo);
    if (numero === 2) return modelo.habilidades.length > 0;
    if (numero === 3) return modelo.objetos.length > 0;
    if (numero === 4) return modelo.instrumentos.length > 0 && modelo.recursosAvaliacao.length > 0;
    if (numero === 5) return modelo.metodologias.length > 0 && modelo.recursosMetodologia.length > 0;
    return false;
  };

  const mensagemEtapa = (numero) => {
    if (numero === 1) return "Preencha componente, ano e período antes de avançar.";
    if (numero === 2) return "Selecione pelo menos uma habilidade antes de avançar.";
    if (numero === 3) return "Selecione pelo menos um objeto de conhecimento antes de avançar.";
    if (numero === 4) return "Selecione instrumentos avaliativos e recursos de avaliação antes de avançar.";
    if (numero === 5) return "Selecione metodologias e recursos de metodologia antes de finalizar.";
    return "Preencha os campos obrigatórios antes de avançar.";
  };

  const etapaLiberada = (numero) => {
    if (id || numero === 1) return true;

    for (let atual = 1; atual < numero; atual += 1) {
      if (!etapaCompleta(atual)) return false;
    }

    return true;
  };

  const navegarEtapa = (numero) => {
    if (id || numero <= etapa) {
      setEtapa(numero);
      return;
    }

    for (let atual = 1; atual < numero; atual += 1) {
      if (!etapaCompleta(atual)) {
        setPopup({
          show: true,
          mensagem: mensagemEtapa(atual),
          tipo: "erro"
        });
        setEtapa(atual);
        return;
      }
    }

    setEtapa(numero);
  };

  const avancarEtapa = (proximaEtapa) => {
    if (!etapaCompleta(etapa)) {
      setPopup({
        show: true,
        mensagem: mensagemEtapa(etapa),
        tipo: "erro"
      });
      return;
    }

    setEtapa(proximaEtapa);
  };

  return (
    <div className="box">

      <div className="plano-form-header">
        <div>
          <span className="plano-form-kicker">Modelo de planejamento</span>
          <h1>{id ? "Editar Plano" : "Criar modelo do Plano"}</h1>
        </div>
      </div>

      <div className="etapas-plano" aria-label="Etapas da criação do plano">
        {etapasPlano.map((item) => (
          <button
            key={item.numero}
            type="button"
            className={`etapa-pill ${etapa === item.numero ? "ativa" : ""} ${etapa > item.numero ? "concluida" : ""}`}
            onClick={() => navegarEtapa(item.numero)}
            disabled={!etapaLiberada(item.numero)}
          >
            <span>{item.numero}</span>
            {item.label}
          </button>
        ))}
      </div>

      {popup.show && (
        <Toast
          key={popup.mensagem}      // força a animação sempre que a mensagem mudar
          mensagem={popup.mensagem}
          tipo={popup.tipo}
          onClose={() => setPopup({ show: false, mensagem: "", tipo: "" })}
        />
      )}

      {id && (
        <div className="resumo-edicao">
          <p><strong>Componente:</strong> {modelo.componente}</p>
          <p><strong>Ano:</strong> {modelo.ano}</p>
          <p><strong>Período:</strong> {modelo.periodo || "Não definido"}</p>
        </div>
      )}

      {etapa === 1 && !id && (
        <>
          <select value={modelo.componente} onChange={(e) => setModelo({ ...modelo, componente: e.target.value })}>
            <option value="">Componente</option>
            {componentes.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select value={modelo.ano} onChange={(e) => setModelo({ ...modelo, ano: e.target.value })}>
            <option value="">Ano</option>
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select value={modelo.periodo} onChange={(e) => setModelo({ ...modelo, periodo: e.target.value })}>
            <option value="">Período</option>
            <option value="1">1º</option>
            <option value="2">2º</option>
            <option value="3">3º</option>
            <option value="4">4º</option>
          </select>

          <button className="btn btn-primary btn-right btn-margem" onClick={validarEtapa1}>AVANÇAR <ChevronRight color="#ffff" size={20} /></button>
        </>
      )}

      {etapa === 2 && (
        <>
          <h2>Habilidades</h2>
          <input
            value={busca}
            placeholder="Buscar por codigo ou habilidade..."
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="lista">
            {habilidadesFiltradas.length > 0 ? (
              habilidadesFiltradas.map((h) => (
                <label key={h.codigo} className="habilidade-opcao">
                  <input
                    type="checkbox"
                    checked={modelo.habilidades.includes(h.codigo)}
                    onChange={() => toggle("habilidades", h.codigo)}
                  />
                  <span className="habilidade-codigo">{h.codigo}</span>
                  <span className="habilidade-descricao">{h.descricao}</span>
                </label>
              ))
            ) : (
              <p className="lista-vazia">Nenhuma habilidade encontrada.</p>
            )}
          </div>
          <button className="btn btn-success" onClick={selecionarTodasHabilidades}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, habilidades: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>

          <div className="acoes">
            <button className="btn btn-info btn-etapa" onClick={() => setEtapa(1)}><CircleArrowLeft color="#ffffff" size={22} />Anterior</button>
            <button className="btn btn-primary btn-etapa" onClick={() => avancarEtapa(3)}>Próximo<CircleArrowRight color="#ffffff" size={22} /></button>
          </div>

        </>
      )}

      {etapa === 3 && (
        <>
          <h2>Objetos de Conhecimento</h2>

          <div className="lista">
            {objetosFiltrados().map((obj) => (
              <label key={obj}>
                <input
                  type="checkbox"
                  checked={modelo.objetos.includes(obj)}
                  onChange={() => toggle("objetos", obj)}
                />
                {obj}
              </label>
            ))}
          </div>
          <button className="btn btn-success" onClick={() => setModelo({ ...modelo, objetos: objetosFiltrados() })}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, objetos: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>

          <div className="acoes">
            <button className="btn btn-info btn-etapa" onClick={() => setEtapa(2)}><CircleArrowLeft color="#ffffff" size={22} />Anterior</button>
            <button className="btn btn-primary btn-etapa" onClick={() => avancarEtapa(4)}>Próximo<CircleArrowRight color="#ffffff" size={22} /></button>
          </div>
        </>
      )}

      {etapa === 4 && (
        <>
          <h2>Instrumentos Avaliativos</h2>
          {["Prova objetiva de múltipla-escolha", "Prova oral", "Prova discursiva", "Vistos em caderno", "Observação"].map((i) => (
            <label key={i}>
              <input type="checkbox" checked={modelo.instrumentos.includes(i)} onChange={() => toggle("instrumentos", i)} />
              {i}
            </label>
          ))}
          <button className="btn btn-success" onClick={() => setModelo({ ...modelo, instrumentos: opcoesInstrumentos })}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, instrumentos: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>

          <h3>Recursos usados na mensuração da aprendizagem</h3>

          {["Escrita no quadro", "Impressão em folha", "Livro didático", "Ditada", "Projeção da atividade", "Jogos", "Links"].map((r) => (
            <label key={r}>
              <input type="checkbox" checked={modelo.recursosAvaliacao.includes(r)} onChange={() => toggle("recursosAvaliacao", r)} />
              {r}
            </label>
          ))}
          <button className="btn btn-success" onClick={() => setModelo({ ...modelo, recursosAvaliacao: recursosAvaliacao })}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, recursosAvaliacao: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>

          <div className="acoes">
            <button className="btn btn-info btn-etapa" onClick={() => setEtapa(3)}><CircleArrowLeft color="#ffffff" size={22} />Anterior</button>
            <button className="btn btn-primary btn-etapa" onClick={() => avancarEtapa(5)}>Próximo<CircleArrowRight color="#ffffff" size={22} /></button>
          </div>
        </>
      )}

      {etapa === 5 && (
        <>
          <h2>Metodologias</h2>
          {["Expositiva ou instrucional", "Seminário", "Debate", "Sala de aula invertida", "Gamificação", "Ensino Hibrido", "Design Thinking", "STEAM", "Cultura Maker"].map((m) => (
            <label key={m}>
              <input type="checkbox" checked={modelo.metodologias.includes(m)} onChange={() => toggle("metodologias", m)} />
              {m}
            </label>
          ))}
          <button className="btn btn-success" onClick={() => setModelo({ ...modelo, metodologias: metodologias })}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, metodologias: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>


          <h3>Recursos usados na abordagem do conhecimento</h3>

          {["Caixa amplificada", "Escrita no quadro", "Projeção de aula", "Impressão em folha", "Livro didático", "Jogos", "Vídeos", "Materiais concretos", "Áudios", "Cartazes", "Pesquisas na internet"].map((r) => (
            <label key={r}>
              <input type="checkbox" checked={modelo.recursosMetodologia.includes(r)} onChange={() => toggle("recursosMetodologia", r)} />
              {r}
            </label>
          ))}

          <button className="btn btn-success" onClick={() => setModelo({ ...modelo, recursosMetodologia: recursosMetodologia })}><CopyCheck color="#ffff" size={15}/>Selecionar todos</button>
          <button className="btn btn-danger" onClick={() => setModelo({ ...modelo, recursosMetodologia: [] })}><CopyX color="#ffff" size={15}/>Desmarcar todos</button>

          <button className="btn btn-primary btn-right btn-margem" onClick={handleSalvar}><Layers3 color="#ffff" size={20} />FINALIZAR</button>
          
        </>
      )}
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{
            width: `${(etapa / 5) * 100}%`,
            background: (etapa / 5) === 1 ? "#16a34a" : "linear-gradient(90deg, #3b82f6, #60a5fa)"
            /* verde se 100%, azul gradiente caso contrário */
          }}
        />
      </div>

    </div>
  );
}
