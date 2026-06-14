import { useEffect, useMemo, useState } from "react";
import {
  listarProfessores,
  listarComponentes,
  listarEscolas,
  listarTurmas,
  salvarProfessor,
  atualizarProfessor,
  deletarProfessor
} from "../services/api";
import { ArrowLeft, MinusCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Toast from "./Toast";
import "./professores.css";

const estadoInicial = {
  nome: "",
  turno: "",
  email: "",
  senha: "",
  atribuicoes: []
};

const atribuicaoInicial = {
  escolaId: "",
  componenteId: "",
  ano: "",
  turma: ""
};

const anosDisponiveis = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º"];
const letrasTurmaDisponiveis = ["A", "B", "C", "D", "E", "F", "G"];

export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [escolas, setEscolas] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [modelo, setModelo] = useState(estadoInicial);
  const [novaAtribuicao, setNovaAtribuicao] = useState(atribuicaoInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    mensagem: "",
    tipo: "sucesso"
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [professoresData, escolasData, componentesData, turmasData] = await Promise.all([
          listarProfessores(),
          listarEscolas(),
          listarComponentes(),
          listarTurmas()
        ]);

        setProfessores(professoresData || []);
        setEscolas(escolasData || []);
        setComponentes(componentesData || []);
        setTurmas(turmasData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showToast("Erro ao carregar dados do cadastro.", "erro");
      }
    }

    carregarDados();
  }, []);

  function showToast(mensagem, tipo = "sucesso") {
    setToast({ show: true, mensagem, tipo });
  }

  function fecharToast() {
    setToast({ show: false, mensagem: "", tipo: "sucesso" });
  }

  function normalizarAno(valor) {
    return String(valor || "")
      .replace("º", "")
      .replace("ª", "")
      .replace(/\s+/g, "")
      .trim();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setModelo((prev) => ({ ...prev, [name]: value }));
  }

  function handleChangeAtribuicao(event) {
    const { name, value } = event.target;
    setNovaAtribuicao((prev) => ({ ...prev, [name]: value }));
  }

  function limparFormulario() {
    setModelo(estadoInicial);
    setNovaAtribuicao(atribuicaoInicial);
    setEditandoId(null);
  }

  async function recarregarProfessores() {
    try {
      const professoresData = await listarProfessores();
      setProfessores(professoresData || []);
    } catch (error) {
      console.error("Erro ao recarregar professores:", error);
    }
  }

  function abrirCadastro() {
    limparFormulario();
    setFormularioAberto(true);
  }

  function voltarParaListagem() {
    limparFormulario();
    setFormularioAberto(false);
  }

  function editarProfessor(professor) {
    setModelo({
      nome: professor.nome || "",
      turno: professor.turno || "",
      email: professor.email || "",
      senha: professor.senha || "",
      atribuicoes: (professor.atribuicoes || []).map((item) => ({
        escolaId: item.escola_id,
        componenteId: item.componente_id,
        turmaId: item.turma_id
      }))
    });
    setNovaAtribuicao(atribuicaoInicial);
    setEditandoId(professor.id);
    setFormularioAberto(true);
  }

  async function excluirProfessor(id) {
    const confirmar = window.confirm("Deseja realmente deletar este usuario?");
    if (!confirmar) return;

    try {
      const resposta = await deletarProfessor(id);

      if (resposta?.erro || resposta?.error) {
        showToast(resposta.erro || resposta.error, "erro");
        return;
      }

      showToast("Usuario deletado com sucesso.", "sucesso");
      recarregarProfessores();
    } catch (error) {
      console.error("Erro ao deletar usuario:", error);
      showToast("Erro ao deletar usuario.", "erro");
    }
  }

  function adicionarAtribuicao() {
    const { escolaId, componenteId, ano, turma } = novaAtribuicao;

    if (!escolaId || !componenteId || !ano || !turma) {
      showToast("Selecione escola, componente, ano e turma.", "erro");
      return;
    }

    const turmaEncontrada = turmas.find((item) => {
      const anoItem = normalizarAno(item.ano);
      const anoSelecionado = normalizarAno(ano);
      return (
        anoItem === anoSelecionado &&
        String(item.turma).toUpperCase() === String(turma).toUpperCase()
      );
    });

    if (!turmaEncontrada) {
      showToast(`A turma ${ano}${turma} nao foi encontrada no banco.`, "erro");
      return;
    }

    const itemNovo = {
      escolaId: Number(escolaId),
      componenteId: Number(componenteId),
      turmaId: Number(turmaEncontrada.id)
    };

    setModelo((prev) => {
      const jaExiste = prev.atribuicoes.some(
        (item) =>
          Number(item.escolaId) === itemNovo.escolaId &&
          Number(item.componenteId) === itemNovo.componenteId &&
          Number(item.turmaId) === itemNovo.turmaId
      );

      if (jaExiste) {
        showToast("Essa atribuicao ja foi adicionada.", "erro");
        return prev;
      }

      return {
        ...prev,
        atribuicoes: [...prev.atribuicoes, itemNovo]
      };
    });

    setNovaAtribuicao(atribuicaoInicial);
  }

  function removerAtribuicao(index) {
    setModelo((prev) => ({
      ...prev,
      atribuicoes: prev.atribuicoes.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  const atribuicoesSelecionadas = useMemo(() => {
    return modelo.atribuicoes.map((item) => {
      const escola = escolas.find((e) => Number(e.id) === Number(item.escolaId));
      const componente = componentes.find((c) => Number(c.id) === Number(item.componenteId));
      const turma = turmas.find((t) => Number(t.id) === Number(item.turmaId));

      return {
        ...item,
        escolaNome: escola?.nome || "Escola nao encontrada",
        componenteNome: componente?.nome || "Componente nao encontrado",
        turmaNome: turma?.nome || "Turma nao encontrada"
      };
    });
  }, [modelo.atribuicoes, escolas, componentes, turmas]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!modelo.nome || !modelo.turno || !modelo.email || !modelo.senha) {
      showToast("Preencha nome, turno, e-mail e senha.", "erro");
      return;
    }

    if (modelo.atribuicoes.length === 0) {
      showToast("Adicione pelo menos uma atribuicao.", "erro");
      return;
    }

    setSalvando(true);

    try {
      const resposta = editandoId
        ? await atualizarProfessor(editandoId, modelo)
        : await salvarProfessor(modelo);

      if (resposta.erro || resposta.error) {
        showToast(resposta.erro || resposta.error, "erro");
        return;
      }

      showToast(editandoId ? "Usuario atualizado com sucesso!" : "Usuario cadastrado com sucesso!", "sucesso");
      limparFormulario();
      setFormularioAberto(false);
      recarregarProfessores();
    } catch (error) {
      console.error("Erro ao salvar usuario:", error);
      showToast("Erro ao salvar usuario.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  if (!formularioAberto) {
    return (
      <div className="prof-container">
        <div className="prof-card">
          <div className="prof-lista-header">
            <div>
              <span className="prof-kicker">Usuarios</span>
              <h1>Professores cadastrados</h1>
              <p>Consulte os professores cadastrados e suas atribuicoes.</p>
            </div>

            <button type="button" className="btn-novo-usuario" onClick={abrirCadastro}>
              <Plus size={18} />
              Novo usuario
            </button>
          </div>

          <div className="tabela-wrapper">
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Turno</th>
                  <th>Atribuicoes</th>
                  <th>E-mail</th>
                  <th>Acoes</th>
                </tr>
              </thead>

              <tbody>
                {professores.length > 0 ? (
                  professores.map((professor) => (
                    <tr key={professor.id}>
                      <td data-label="Nome">{professor.nome}</td>
                      <td data-label="Turno">{professor.turno || "-"}</td>
                      <td data-label="Atribuicoes">
                        {(professor.atribuicoes || []).length > 0
                          ? professor.atribuicoes
                              .map(
                                (item) =>
                                  `${item.escola_nome} - ${item.componente_nome} - ${item.turma_nome}`
                              )
                              .join(" | ")
                          : "-"}
                      </td>
                      <td data-label="E-mail">{professor.email}</td>
                      <td data-label="Acoes">
                        <div className="acoes">
                          <button
                            type="button"
                            className="btn-acao editar"
                            onClick={() => editarProfessor(professor)}
                            title="Editar usuario"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            className="btn-acao excluir"
                            onClick={() => excluirProfessor(professor.id)}
                            title="Deletar usuario"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="sem-registro">
                      Nenhum professor cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toast.show && (
          <Toast
            mensagem={toast.mensagem}
            tipo={toast.tipo}
            onClose={fecharToast}
          />
        )}
      </div>
    );
  }

  return (
    <div className="prof-container">
      <div className="prof-card prof-card-formulario">
        <div className="prof-header">
          <div>
            <span className="prof-kicker">Usuarios</span>
            <h1>{editandoId ? "Editar usuario" : "Cadastro de usuario"}</h1>
            <p>{editandoId ? "Atualize os dados e atribuicoes deste professor." : "Cadastre professores e vincule suas atribuicoes por escola, componente, ano e turma."}</p>
          </div>

          <div className="prof-header-acoes">
            <button type="button" className="btn-voltar-cadastro" onClick={voltarParaListagem}>
              <ArrowLeft size={18} />
              Voltar
            </button>

            <button type="button" className="btn-limpar" onClick={limparFormulario}>
              <X size={18} />
              Limpar
            </button>
          </div>
        </div>

        <form className="prof-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              name="nome"
              value={modelo.nome}
              onChange={handleChange}
              placeholder="Digite o nome do professor"
            />
          </div>

          <div className="form-group">
            <label>Turno</label>
            <select name="turno" value={modelo.turno} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Noturno">Noturno</option>
              <option value="Integral">Integral</option>
            </select>
          </div>

          <div className="form-group full">
            <label>Atribuicoes do professor</label>

            <div className="turma-builder">
              <div className="turma-builder-grid">
                <div className="form-group">
                  <label>Escola</label>
                  <select
                    name="escolaId"
                    value={novaAtribuicao.escolaId}
                    onChange={handleChangeAtribuicao}
                  >
                    <option value="">Selecione a escola</option>
                    {escolas.map((escola) => (
                      <option key={escola.id} value={escola.id}>
                        {escola.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Componente</label>
                  <select
                    name="componenteId"
                    value={novaAtribuicao.componenteId}
                    onChange={handleChangeAtribuicao}
                  >
                    <option value="">Selecione o componente</option>
                    {componentes.map((componente) => (
                      <option key={componente.id} value={componente.id}>
                        {componente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ano</label>
                  <select
                    name="ano"
                    value={novaAtribuicao.ano}
                    onChange={handleChangeAtribuicao}
                  >
                    <option value="">Selecione o ano</option>
                    {anosDisponiveis.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Turma</label>
                  <select
                    name="turma"
                    value={novaAtribuicao.turma}
                    onChange={handleChangeAtribuicao}
                  >
                    <option value="">Selecione a turma</option>
                    {letrasTurmaDisponiveis.map((letra) => (
                      <option key={letra} value={letra}>
                        {letra}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="turma-btn-area">
                  <button type="button" className="btn-add-turma" onClick={adicionarAtribuicao}>
                    <Plus size={18} />
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="turmas-selecionadas">
                {atribuicoesSelecionadas.length > 0 ? (
                  atribuicoesSelecionadas.map((item, index) => (
                    <div
                      key={`${item.escolaId}-${item.componenteId}-${item.turmaId}`}
                      className="turma-tag"
                    >
                      <span>
                        {item.escolaNome} - {item.componenteNome} - {item.turmaNome}
                      </span>
                      <button
                        type="button"
                        className="btn-remover-turma"
                        onClick={() => removerAtribuicao(index)}
                      >
                        <MinusCircle size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="turma-vazia">Nenhuma atribuicao adicionada.</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              name="email"
              value={modelo.email}
              onChange={handleChange}
              placeholder="Digite o e-mail"
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              name="senha"
              value={modelo.senha}
              onChange={handleChange}
              placeholder="Digite a senha"
            />
          </div>

          <div className="form-actions full">
            <button type="submit" className="btn-salvar" disabled={salvando}>
              <Save size={18} />
              {salvando
                ? editandoId ? "Atualizando..." : "Cadastrando..."
                : editandoId ? "Atualizar usuario" : "Cadastrar usuario"}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={fecharToast}
        />
      )}
    </div>
  );
}
