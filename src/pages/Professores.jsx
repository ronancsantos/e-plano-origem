import { useEffect, useMemo, useState } from "react";
import {
  listarProfessores,
  salvarProfessor,
  atualizarProfessor,
  deletarProfessor,
  listarEscolas,
  listarComponentes,
  listarTurmas
} from "../services/api";
import { Pencil, Trash2, X, Save, Plus, MinusCircle } from "lucide-react";
import Toast from "./Toast";
import "./professores.css";

export default function Professores() {
  const [professores, setProfessores] = useState([]);
  const [escolas, setEscolas] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const [modelo, setModelo] = useState({
    nome: "",
    turno: "",
    escolas: [],
    componentes: [],
    turmas: [],
    email: "",
    senha: "",
    atribuicoes: []
  });

  const [novaAtribuicao, setNovaAtribuicao] = useState({
    escolaId: "",
    componenteId: "",
    ano: "",
    turma: ""
  });

  const [toast, setToast] = useState({
    show: false,
    mensagem: "",
    tipo: "sucesso"
  });

  function showToast(mensagem, tipo = "sucesso") {
    setToast({
      show: true,
      mensagem,
      tipo
    });
  }

  function fecharToast() {
    setToast({
      show: false,
      mensagem: "",
      tipo: "sucesso"
    });
  }

  const anosDisponiveis = [
    "1º",
    "2º",
    "3º",
    "4º",
    "5º",
    "6º",
    "7º",
    "8º",
    "9º"
  ];

  const letrasTurmaDisponiveis = ["A", "B", "C", "D", "E", "F", "G"];

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [
        professoresData,
        escolasData,
        componentesData,
        turmasData
      ] = await Promise.all([
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
      showToast("Erro ao carregar dados.", "erro");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setModelo((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleChangeAtribuicao(e) {
    const { name, value } = e.target;
    setNovaAtribuicao((prev) => ({
      ...prev,
      [name]: value
    }));
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
      showToast(`A turma ${ano}${turma} não foi encontrada no banco.`, "erro");
      return;
    }

    const escolaIdNum = Number(escolaId);
    const componenteIdNum = Number(componenteId);

    setModelo((prev) => {
      const jaExiste = prev.atribuicoes.some(
        (item) =>
          Number(item.escolaId) === escolaIdNum &&
          Number(item.componenteId) === componenteIdNum &&
          Number(item.turmaId) === Number(turmaEncontrada.id)
      );

      if (jaExiste) {
        showToast("Essa atribuição já foi adicionada.", "erro");
        return prev;
      }

      return {
        ...prev,
        atribuicoes: [
          ...prev.atribuicoes,
          {
            escolaId: escolaIdNum,
            componenteId: componenteIdNum,
            turmaId: Number(turmaEncontrada.id)
          }
        ]
      };
    });

    setNovaAtribuicao({
      escolaId: "",
      componenteId: "",
      ano: "",
      turma: ""
    });
  }

  function removerAtribuicao(index) {
    setModelo((prev) => ({
      ...prev,
      atribuicoes: prev.atribuicoes.filter((_, i) => i !== index)
    }));
  }

  function handleChangeNovaTurma(e) {
    const { name, value } = e.target;
    setNovaTurma((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function normalizarAno(valor) {
    return String(valor || "")
      .replace("º", "")
      .replace("ª", "")
      .replace(/\s+/g, "")
      .trim();
  }

  function adicionarEscola() {
    if (!novaEscolaId) {
      showToast("Selecione uma escola.", "erro");
      return;
    }

    const escolaId = Number(novaEscolaId);

    setModelo((prev) => {
      if (prev.escolas.includes(escolaId)) {
        showToast("Essa escola já foi adicionada.", "erro");
        return prev;
      }

      return {
        ...prev,
        escolas: [...prev.escolas, escolaId]
      };
    });

    setNovaEscolaId("");
  }

  function removerEscola(idEscola) {
    setModelo((prev) => ({
      ...prev,
      escolas: prev.escolas.filter((id) => id !== idEscola)
    }));
  }

  function adicionarComponente() {
    if (!novoComponenteId) {
      showToast("Selecione um componente.", "erro");
      return;
    }

    const componenteId = Number(novoComponenteId);

    setModelo((prev) => {
      if (prev.componentes.includes(componenteId)) {
        showToast("Esse componente já foi adicionado.", "erro");
        return prev;
      }

      return {
        ...prev,
        componentes: [...prev.componentes, componenteId]
      };
    });

    setNovoComponenteId("");
  }

  function removerComponente(idComponente) {
    setModelo((prev) => ({
      ...prev,
      componentes: prev.componentes.filter((id) => id !== idComponente)
    }));
  }

  function adicionarTurma() {
    if (!novaTurma.ano || !novaTurma.turma) {
      showToast("Selecione o ano e a turma.", "erro");
      return;
    }

    const turmaEncontrada = turmas.find((item) => {
      const anoItem = normalizarAno(item.ano);
      const anoSelecionado = normalizarAno(novaTurma.ano);
      return (
        anoItem === anoSelecionado &&
        String(item.turma).toUpperCase() === String(novaTurma.turma).toUpperCase()
      );
    });

    if (!turmaEncontrada) {
      showToast(`A turma ${novaTurma.ano}${novaTurma.turma} não foi encontrada no banco.`, "erro");
      return;
    }

    setModelo((prev) => {
      if (prev.turmas.includes(turmaEncontrada.id)) {
        showToast("Essa turma já foi adicionada.", "erro");
        return prev;
      }

      return {
        ...prev,
        turmas: [...prev.turmas, turmaEncontrada.id]
      };
    });

    setNovaTurma({
      ano: "",
      turma: ""
    });
  }

  function removerTurma(idTurma) {
    setModelo((prev) => ({
      ...prev,
      turmas: prev.turmas.filter((id) => id !== idTurma)
    }));
  }

  function limparFormulario() {
    setModelo({
      nome: "",
      turno: "",
      email: "",
      senha: "",
      atribuicoes: []
    });

    setNovaAtribuicao({
      escolaId: "",
      componenteId: "",
      ano: "",
      turma: ""
    });

    setEditandoId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let atribuicoesAtualizadas = [...modelo.atribuicoes];

    if (
      novaAtribuicao.escolaId &&
      novaAtribuicao.componenteId &&
      novaAtribuicao.ano &&
      novaAtribuicao.turma
    ) {
      const turmaEncontrada = turmas.find((item) => {
        const anoItem = normalizarAno(item.ano);
        const anoSelecionado = normalizarAno(novaAtribuicao.ano);
        return (
          anoItem === anoSelecionado &&
          String(item.turma).toUpperCase() === String(novaAtribuicao.turma).toUpperCase()
        );
      });

      if (turmaEncontrada) {
        const itemTemp = {
          escolaId: Number(novaAtribuicao.escolaId),
          componenteId: Number(novaAtribuicao.componenteId),
          turmaId: Number(turmaEncontrada.id)
        };

        const jaExiste = atribuicoesAtualizadas.some(
          (item) =>
            Number(item.escolaId) === itemTemp.escolaId &&
            Number(item.componenteId) === itemTemp.componenteId &&
            Number(item.turmaId) === itemTemp.turmaId
        );

        if (!jaExiste) {
          atribuicoesAtualizadas.push(itemTemp);
        }
      }
    }

    if (
      !modelo.nome ||
      !modelo.turno ||
      !modelo.email ||
      !modelo.senha ||
      atribuicoesAtualizadas.length === 0
    ) {
      showToast("Preencha todos os campos obrigatórios.", "erro");
      return;
    }

    const payload = {
      nome: modelo.nome,
      turno: modelo.turno,
      email: modelo.email,
      senha: modelo.senha,
      atribuicoes: atribuicoesAtualizadas
    };

    try {
      const resposta = editandoId
        ? await atualizarProfessor(editandoId, payload)
        : await salvarProfessor(payload);

      if (resposta.erro || resposta.error) {
        showToast(resposta.erro || resposta.error, "erro");
        return;
      }

      showToast(
        editandoId
          ? "Professor atualizado com sucesso!"
          : "Professor cadastrado com sucesso!",
        "sucesso"
      );

      limparFormulario();
      carregarDados();
    } catch (error) {
      console.error("Erro ao salvar professor:", error);
      showToast("Erro ao salvar professor.", "erro");
    }
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

    setNovaAtribuicao({
      escolaId: "",
      componenteId: "",
      ano: "",
      turma: ""
    });

    setEditandoId(professor.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirProfessor(id) {
    const confirmar = window.confirm("Deseja realmente excluir este professor?");
    if (!confirmar) return;

    try {
      const resposta = await deletarProfessor(id);

      if (resposta.erro || resposta.error) {
        showToast(resposta.erro || resposta.error, "erro");
        return;
      }

      if (editandoId === id) {
        limparFormulario();
      }

      carregarDados();
      showToast("Professor excluído com sucesso.", "sucesso");
    } catch (error) {
      console.error("Erro ao excluir professor:", error);
      showToast("Erro ao excluir professor.", "erro");
    }
  }

  const escolasSelecionadas = useMemo(() => {
    return modelo.escolas
      .map((idEscola) => escolas.find((item) => item.id === idEscola))
      .filter(Boolean);
  }, [modelo.escolas, escolas]);

  const componentesSelecionados = useMemo(() => {
    return modelo.componentes
      .map((idComponente) => componentes.find((item) => item.id === idComponente))
      .filter(Boolean);
  }, [modelo.componentes, componentes]);

  const turmasSelecionadas = useMemo(() => {
    return modelo.turmas
      .map((idTurma) => turmas.find((item) => item.id === idTurma))
      .filter(Boolean);
  }, [modelo.turmas, turmas]);

  const atribuicoesSelecionadas = useMemo(() => {
    return modelo.atribuicoes.map((item) => {
      const escola = escolas.find((e) => Number(e.id) === Number(item.escolaId));
      const componente = componentes.find((c) => Number(c.id) === Number(item.componenteId));
      const turma = turmas.find((t) => Number(t.id) === Number(item.turmaId));

      return {
        ...item,
        escolaNome: escola?.nome || "Escola não encontrada",
        componenteNome: componente?.nome || "Componente não encontrado",
        turmaNome: turma?.nome || "Turma não encontrada"
      };
    });
  }, [modelo.atribuicoes, escolas, componentes, turmas]);

  return (
    <div className="prof-container">
      <div className="prof-card">
        <div className="prof-header">
          <h1>Cadastro de Professores</h1>

          <button type="button" className="btn-limpar" onClick={limparFormulario}>
            <X size={18} />
            Limpar
          </button>
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
            <label>Atribuições do Professor</label>

            <div className="turma-builder">
              <div className="turma-builder-grid" style={{ gridTemplateColumns: "repeat(4, 1fr) auto" }}>
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
                  <button
                    type="button"
                    className="btn-add-turma"
                    onClick={adicionarAtribuicao}
                  >
                    <Plus size={18} />
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="turmas-selecionadas">
                {atribuicoesSelecionadas.length > 0 ? (
                  atribuicoesSelecionadas.map((item, index) => (
                    <div key={`${item.escolaId}-${item.componenteId}-${item.turmaId}`} className="turma-tag">
                      <span>
                        {item.escolaNome} — {item.componenteNome} — {item.turmaNome}
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
                  <div className="turma-vazia">Nenhuma atribuição adicionada.</div>
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
            <button type="submit" className="btn-salvar">
              <Save size={18} />
              {editandoId ? "Atualizar Professor" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>

      <div className="prof-card">
        <h2>Professores Cadastrados</h2>

        <div className="tabela-wrapper">
          <table className="prof-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Turno</th>
                <th>Atribuições</th>
                <th>Componentes</th>
                <th>E-mail</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {professores.length > 0 ? (
                professores.map((professor) => (
                  <tr key={professor.id}>
                    <td>{professor.nome}</td>
                    <td>{professor.turno}</td>
                    <td>
                      {(professor.atribuicoes || []).length > 0
                        ? professor.atribuicoes
                          .map(
                            (item) =>
                              `${item.escola_nome} — ${item.componente_nome} — ${item.turma_nome}`
                          )
                          .join(" | ")
                        : "-"}
                    </td>
                    <td>{professor.email}</td>
                    <td>
                      <div className="acoes">
                        <button
                          type="button"
                          className="btn-acao editar"
                          onClick={() => editarProfessor(professor)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          className="btn-acao excluir"
                          onClick={() => excluirProfessor(professor.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="sem-registro">
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
