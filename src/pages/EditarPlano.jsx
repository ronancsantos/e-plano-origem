import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CopyCheck, CopyX, Eye, Save } from "lucide-react";
import { atualizarPlano, buscarPlano, listarBNCC } from "../services/api";
import Toast from "./Toast";
import "./editar.css";

const componentes = [
  { value: "lingua_portuguesa", label: "Lingua Portuguesa" },
  { value: "lp_leitura", label: "LP - Leitura e Oralidade" },
  { value: "lp_producao_oralidade", label: "LP - Producao de Texto-Oralidade" },
  { value: "lp_analise_linguistica_e_Semiotica", label: "LP - Analise Linguistica e Semiotica" },
  { value: "arte", label: "Arte" },
  { value: "educacao_fisica", label: "Educacao Fisica" },
  { value: "lingua_inglesa", label: "Lingua Inglesa" },
  { value: "matematica", label: "Matematica" },
  { value: "ciencias", label: "Ciencias" },
  { value: "geografia", label: "Geografia" },
  { value: "historia", label: "Historia" },
  { value: "ensino_religioso", label: "Ensino Religioso" },
  { value: "computacao", label: "Computacao" }
];

const anos = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º"];
const periodos = ["1", "2", "3", "4"];

const opcoesInstrumentos = [
  "Prova objetiva de multipla-escolha",
  "Prova oral",
  "Prova discursiva",
  "Vistos em caderno",
  "Observacao"
];

const opcoesRecursosAvaliacao = [
  "Escrita no quadro",
  "Impressao em folha",
  "Livro didatico",
  "Ditada",
  "Projecao da atividade",
  "Jogos",
  "Links"
];

const opcoesMetodologias = [
  "Expositiva ou instrucional",
  "Seminario",
  "Debate",
  "Sala de aula invertida",
  "Gamificacao",
  "Ensino Hibrido",
  "Design Thinking",
  "STEAM",
  "Cultura Maker"
];

const opcoesRecursosMetodologia = [
  "Caixa amplificada",
  "Escrita no quadro",
  "Projecao de aula",
  "Impressao em folha",
  "Livro didatico",
  "Jogos",
  "Videos",
  "Materiais concretos",
  "Audios",
  "Cartazes",
  "Pesquisas na internet"
];

const estadoInicial = {
  componente: "",
  ano: "",
  periodo: "",
  habilidades: [],
  objetos: [],
  instrumentos: [],
  instrumentos_recursos: [],
  tipos_avaliacao: [],
  metodologias: [],
  metodologias_recursos: [],
  campo_atuacao: "",
  generos: [],
  descritores: [],
  status: "concluido"
};

function limparPeriodo(valor) {
  if (!valor) return "";

  try {
    let periodo = valor;
    while (typeof periodo === "string" && (periodo.startsWith('"') || periodo.startsWith("["))) {
      periodo = JSON.parse(periodo);
    }
    if (Array.isArray(periodo)) return String(periodo[0] || "").replace(/\D/g, "");
    return String(periodo).replace(/\D/g, "");
  } catch {
    return String(valor).replace(/\D/g, "");
  }
}

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function listaEmArray(valor) {
  return Array.isArray(valor) ? valor.filter(Boolean) : [];
}

export default function EditarPlano() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(estadoInicial);
  const [bncc, setBncc] = useState({});
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [popup, setPopup] = useState({ show: false, mensagem: "", tipo: "" });

  useEffect(() => {
    async function carregarModelo() {
      try {
        setCarregando(true);
        const data = await buscarPlano(id);

        setForm({
          ...estadoInicial,
          ...data,
          periodo: limparPeriodo(data.periodo),
          habilidades: listaEmArray(data.habilidades),
          objetos: listaEmArray(data.objetos),
          instrumentos: listaEmArray(data.instrumentos),
          instrumentos_recursos: listaEmArray(data.instrumentos_recursos),
          tipos_avaliacao: listaEmArray(data.tipos_avaliacao),
          metodologias: listaEmArray(data.metodologias),
          metodologias_recursos: listaEmArray(data.metodologias_recursos),
          generos: listaEmArray(data.generos),
          descritores: listaEmArray(data.descritores),
          status: data.status || "concluido"
        });
      } catch (error) {
        console.error("Erro ao carregar modelo:", error);
        setPopup({ show: true, mensagem: "Modelo nao encontrado.", tipo: "erro" });
      } finally {
        setCarregando(false);
      }
    }

    carregarModelo();
  }, [id]);

  useEffect(() => {
    async function carregarBncc() {
      if (!form.componente || !form.ano) {
        setBncc({});
        return;
      }

      try {
        const anoLimpo = String(form.ano).replace(/\D/g, "");
        const dados = await listarBNCC(form.componente, anoLimpo);
        setBncc(dados || {});
      } catch (error) {
        console.error("Erro ao carregar BNCC:", error);
        setBncc({});
      }
    }

    carregarBncc();
  }, [form.componente, form.ano]);

  const habilidadesDisponiveis = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    const todas = Object.values(bncc)
      .flatMap((objetos) => Object.values(objetos || {}))
      .flat()
      .filter(Boolean);

    return [
      ...new Map(
        todas
          .filter((habilidade) => {
            if (!termo) return true;
            return [habilidade.codigo, habilidade.descricao].some((valor) =>
              normalizarTexto(valor).includes(termo)
            );
          })
          .map((habilidade) => [habilidade.codigo, habilidade])
      ).values()
    ];
  }, [bncc, busca]);

  const objetosRelacionados = useMemo(() => {
    const objetos = [];

    Object.entries(bncc).forEach(([, grupoObjetos]) => {
      Object.entries(grupoObjetos || {}).forEach(([objetoNome, habilidades]) => {
        (habilidades || []).forEach((habilidade) => {
          if (form.habilidades.includes(habilidade.codigo)) {
            objetos.push(objetoNome);
          }
        });
      });
    });

    return [...new Set(objetos)];
  }, [bncc, form.habilidades]);

  useEffect(() => {
    setForm((prev) => {
      const mesmosObjetos =
        prev.objetos.length === objetosRelacionados.length &&
        objetosRelacionados.every((objeto) => prev.objetos.includes(objeto));

      if (mesmosObjetos) return prev;
      return { ...prev, objetos: objetosRelacionados };
    });
  }, [objetosRelacionados]);

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleItem(campo, valor) {
    setForm((prev) => {
      const lista = listaEmArray(prev[campo]);
      const novaLista = lista.includes(valor)
        ? lista.filter((item) => item !== valor)
        : [...lista, valor];

      return { ...prev, [campo]: novaLista };
    });
  }

  function selecionarTodos(campo, lista) {
    setForm((prev) => ({ ...prev, [campo]: [...lista] }));
  }

  function atualizarTextoLista(campo, valor) {
    const lista = valor
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    atualizarCampo(campo, lista);
  }

  function validarModelo() {
    if (!form.componente || !form.ano || !form.periodo) {
      return "Preencha componente, ano e periodo.";
    }

    if (form.habilidades.length === 0) {
      return "Selecione pelo menos uma habilidade.";
    }

    if (form.objetos.length === 0) {
      return "Selecione pelo menos um objeto de conhecimento.";
    }

    if (form.instrumentos.length === 0 || form.instrumentos_recursos.length === 0) {
      return "Selecione instrumentos avaliativos e recursos de avaliacao.";
    }

    if (form.metodologias.length === 0 || form.metodologias_recursos.length === 0) {
      return "Selecione metodologias e recursos de metodologia.";
    }

    return "";
  }

  async function handleSalvar() {
    const erroValidacao = validarModelo();

    if (erroValidacao) {
      setPopup({ show: true, mensagem: erroValidacao, tipo: "erro" });
      return;
    }

    setSalvando(true);

    try {
      await atualizarPlano(id, {
        ...form,
        periodo: limparPeriodo(form.periodo),
        status: form.status || "concluido"
      });

      setPopup({ show: true, mensagem: "Modelo editado com sucesso!", tipo: "sucesso" });

      setTimeout(() => {
        navigate("/planos");
      }, 1200);
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      setPopup({ show: true, mensagem: "Erro ao salvar modelo.", tipo: "erro" });
    } finally {
      setSalvando(false);
    }
  }

  function renderCheckboxLista(campo, opcoes) {
    return (
      <div className="editar-opcoes-grid">
        {opcoes.map((item) => (
          <label key={item} className="editar-checkbox">
            <input
              type="checkbox"
              checked={listaEmArray(form[campo]).includes(item)}
              onChange={() => toggleItem(campo, item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    );
  }

  if (carregando) {
    return <div className="editar-modelo-page editar-estado">Carregando modelo...</div>;
  }

  return (
    <div className="editar-modelo-page">
      {popup.show && (
        <Toast
          key={popup.mensagem}
          mensagem={popup.mensagem}
          tipo={popup.tipo}
          onClose={() => setPopup({ show: false, mensagem: "", tipo: "" })}
        />
      )}

      <div className="editar-modelo-topo">
        <div>
          <span>Modelo do coordenador</span>
          <h1>Editar modelo de plano</h1>
          <p>Atualize o modelo enviado aos professores mantendo habilidades, objetos, avaliacao e metodologia alinhados.</p>
        </div>

        <div className="editar-topo-acoes">
          <button className="editar-btn editar-btn-secundario" onClick={() => navigate("/planos")}>
            <ArrowLeft size={18} />
            Voltar
          </button>
          <button className="editar-btn editar-btn-secundario" onClick={() => navigate(`/visualizar/${id}`)}>
            <Eye size={18} />
            Ver
          </button>
          <button className="editar-btn editar-btn-primario" onClick={handleSalvar} disabled={salvando}>
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <section className="editar-card editar-card-resumo">
        <div className="editar-form-grid">
          <label>
            <span>Componente</span>
            <select value={form.componente} onChange={(e) => atualizarCampo("componente", e.target.value)}>
              <option value="">Selecione</option>
              {componentes.map((componente) => (
                <option key={componente.value} value={componente.value}>
                  {componente.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Ano</span>
            <select value={form.ano} onChange={(e) => atualizarCampo("ano", e.target.value)}>
              <option value="">Selecione</option>
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Periodo</span>
            <select value={form.periodo} onChange={(e) => atualizarCampo("periodo", e.target.value)}>
              <option value="">Selecione</option>
              {periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}º
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e) => atualizarCampo("status", e.target.value)}>
              <option value="rascunho">Rascunho</option>
              <option value="concluido">Concluido</option>
            </select>
          </label>
        </div>
      </section>

      <section className="editar-card">
        <div className="editar-secao-header">
          <div>
            <h2>Habilidades</h2>
            <p>Busque e selecione as habilidades da BNCC. Os objetos de conhecimento serao atualizados automaticamente.</p>
          </div>
          <div className="editar-mini-acoes">
            <button className="editar-btn editar-btn-sucesso" onClick={() => selecionarTodos("habilidades", habilidadesDisponiveis.map((h) => h.codigo))}>
              <CopyCheck size={16} />
              Selecionar
            </button>
            <button className="editar-btn editar-btn-perigo" onClick={() => atualizarCampo("habilidades", [])}>
              <CopyX size={16} />
              Limpar
            </button>
          </div>
        </div>

        <input
          className="editar-busca"
          value={busca}
          placeholder="Buscar por codigo ou habilidade..."
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="editar-lista-scroll">
          {habilidadesDisponiveis.length > 0 ? (
            habilidadesDisponiveis.map((habilidade) => (
              <label key={habilidade.codigo} className="editar-checkbox editar-habilidade">
                <input
                  type="checkbox"
                  checked={form.habilidades.includes(habilidade.codigo)}
                  onChange={() => toggleItem("habilidades", habilidade.codigo)}
                />
                <strong>{habilidade.codigo}</strong>
                <span>{habilidade.descricao}</span>
              </label>
            ))
          ) : (
            <p className="editar-vazio">Nenhuma habilidade encontrada.</p>
          )}
        </div>
      </section>

      <section className="editar-card">
        <div className="editar-secao-header">
          <div>
            <h2>Objetos de conhecimento</h2>
            <p>Esta lista acompanha as habilidades selecionadas e fica marcada automaticamente.</p>
          </div>
        </div>

        <div className="editar-lista-scroll editar-lista-menor">
          {objetosRelacionados.length > 0 ? (
            objetosRelacionados.map((objeto) => (
              <label key={objeto} className="editar-checkbox">
                <input
                  type="checkbox"
                  checked={form.objetos.includes(objeto)}
                  onChange={() => toggleItem("objetos", objeto)}
                />
                <span>{objeto}</span>
              </label>
            ))
          ) : (
            <p className="editar-vazio">Selecione habilidades para gerar os objetos de conhecimento.</p>
          )}
        </div>
      </section>

      <section className="editar-grid-secoes">
        <div className="editar-card">
          <h2>Avaliação</h2>

          <h3>Instrumentos avaliativos</h3>
          {renderCheckboxLista("instrumentos", opcoesInstrumentos)}
          <div className="editar-mini-acoes">
            <button className="editar-btn editar-btn-sucesso" onClick={() => selecionarTodos("instrumentos", opcoesInstrumentos)}>Selecionar todos</button>
            <button className="editar-btn editar-btn-perigo" onClick={() => atualizarCampo("instrumentos", [])}>Limpar</button>
          </div>

          <h3>Recursos usados na mensuracao da aprendizagem</h3>
          {renderCheckboxLista("instrumentos_recursos", opcoesRecursosAvaliacao)}
          <div className="editar-mini-acoes">
            <button className="editar-btn editar-btn-sucesso" onClick={() => selecionarTodos("instrumentos_recursos", opcoesRecursosAvaliacao)}>Selecionar todos</button>
            <button className="editar-btn editar-btn-perigo" onClick={() => atualizarCampo("instrumentos_recursos", [])}>Limpar</button>
          </div>

          <h3>Criterios avaliativos</h3>
          <textarea
            value={form.tipos_avaliacao.join("\n")}
            onChange={(e) => atualizarTextoLista("tipos_avaliacao", e.target.value)}
            placeholder="Digite um criterio por linha."
          />
        </div>

        <div className="editar-card">
          <h2>Metodologia</h2>

          <h3>Metodologias</h3>
          {renderCheckboxLista("metodologias", opcoesMetodologias)}
          <div className="editar-mini-acoes">
            <button className="editar-btn editar-btn-sucesso" onClick={() => selecionarTodos("metodologias", opcoesMetodologias)}>Selecionar todos</button>
            <button className="editar-btn editar-btn-perigo" onClick={() => atualizarCampo("metodologias", [])}>Limpar</button>
          </div>

          <h3>Recursos usados na abordagem do conhecimento</h3>
          {renderCheckboxLista("metodologias_recursos", opcoesRecursosMetodologia)}
          <div className="editar-mini-acoes">
            <button className="editar-btn editar-btn-sucesso" onClick={() => selecionarTodos("metodologias_recursos", opcoesRecursosMetodologia)}>Selecionar todos</button>
            <button className="editar-btn editar-btn-perigo" onClick={() => atualizarCampo("metodologias_recursos", [])}>Limpar</button>
          </div>
        </div>
      </section>

      <section className="editar-card">
        <h2>Complementos pedagógicos</h2>
        <div className="editar-form-grid editar-form-grid-dupla">
          <label>
            <span>Campo de atuacao</span>
            <input
              value={form.campo_atuacao || ""}
              onChange={(e) => atualizarCampo("campo_atuacao", e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <label>
            <span>Gêneros sugeridos</span>
            <textarea
              value={form.generos.join("\n")}
              onChange={(e) => atualizarTextoLista("generos", e.target.value)}
              placeholder="Digite um genero por linha."
            />
          </label>

          <label className="editar-campo-largo">
            <span>Descritores</span>
            <textarea
              value={form.descritores.join("\n")}
              onChange={(e) => atualizarTextoLista("descritores", e.target.value)}
              placeholder="Digite um descritor por linha."
            />
          </label>
        </div>
      </section>

      <div className="editar-rodape-acoes">
        <button className="editar-btn editar-btn-secundario" onClick={() => navigate("/planos")}>
          Cancelar
        </button>
        <button className="editar-btn editar-btn-primario" onClick={handleSalvar} disabled={salvando}>
          <Save size={18} />
          {salvando ? "Salvando..." : "Salvar modelo"}
        </button>
      </div>
    </div>
  );
}
