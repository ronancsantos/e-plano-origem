const express = require("express");
const cors = require("cors");
const fs = require("fs");
const authRoutes = require("./routes/auth");
const db = require("./database.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

app.use(cors({
  origin: [
    "http://localhost:5173",
  ],
  credentials: true
}));

// Corrige qualquer formato errado de periodo
const parsePeriodo = (p) => {
  try {
    const parsed = JSON.parse(p);
    if (Array.isArray(parsed)) return parsed[0];
    return parsed;
  } catch {
    return p;
  }
};

// Converte campos JSON com segurança
const parseJSON = (value) => {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
};

// ================= FUNÇÕES AUXILIARES PROFESSORES =================
const formatarListaProfessor = (valor) => {
  if (!valor) return [];

  return valor.split(",").map((item) => {
    const partes = item.split("|");
    const id = Number(partes[0]);
    const nome = partes.slice(1).join("|");
    return { id, nome };
  });
};

const limparAtuacoesProfessor = (professorId, callback) => {
  db.run(
    `DELETE FROM professor_atuacoes WHERE professor_id = ?`,
    [professorId],
    callback
  );
};

const inserirAtuacoesProfessor = (professorId, atribuicoes, callback) => {
  const lista = Array.isArray(atribuicoes) ? atribuicoes : [];

  if (lista.length === 0) {
    callback?.(null);
    return;
  }

  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO professor_atuacoes (professor_id, escola_id, componente_id, turma_id)
      VALUES (?, ?, ?, ?)
    `);

    lista.forEach((item) => {
      stmt.run(
        professorId,
        Number(item.escolaId),
        Number(item.componenteId),
        Number(item.turmaId)
      );
    });

    stmt.finalize(callback);
  });
};

// ================= ROTAS =================

// 🔥 CRIAR PLANO
app.post("/planos", (req, res) => {
  const {
    professor_id,
    componente,
    ano,
    periodo,
    campo_atuacao,
    genero,
    habilidades,
    objetos,
    metodologias,
    metodologias_recursos,
    instrumentos,
    instrumentos_recursos,
    tipos_avaliacao,
    status,
    progresso
  } = req.body;

  db.run(
    `INSERT INTO planos (
      professor_id,
      componente,
      ano,
      periodo,
      campo_atuacao,
      genero,
      habilidades,
      objetos,
      metodologias,
      metodologias_recursos,
      instrumentos,
      instrumentos_recursos,
      tipos_avaliacao,
      status,
      progresso
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      professor_id || null,
      componente || "",
      ano || "",
      periodo || "",
      campo_atuacao || "",
      genero || "",
      JSON.stringify(habilidades || []),
      JSON.stringify(objetos || []),
      JSON.stringify(metodologias || []),
      JSON.stringify(metodologias_recursos || []),
      JSON.stringify(instrumentos || []),
      JSON.stringify(instrumentos_recursos || []),
      JSON.stringify(tipos_avaliacao || []),
      status || "rascunho",
      progresso || 0
    ],
    function (err) {
      if (err) {
        console.error("ERRO AO SALVAR:", err.message);
        return res.status(500).json({ error: err.message });
      }

      res.json({ id: this.lastID });
    }
  );
});

//Atribuições
db.run(`
CREATE TABLE IF NOT EXISTS professor_atuacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professor_id INTEGER NOT NULL,
  escola_id INTEGER NOT NULL,
  componente_id INTEGER NOT NULL,
  turma_id INTEGER NOT NULL,
  UNIQUE(professor_id, escola_id, componente_id, turma_id),
  FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
  FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE,
  FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE CASCADE,
  FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
)
`);

// 🔥 LISTAR PLANOS
app.get("/planos", (req, res) => {
  db.all("SELECT * FROM planos ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("ERRO AO LISTAR PLANOS:", err.message);
      return res.status(500).json({ error: err.message });
    }

    const planos = rows.map((p) => ({
      ...p,
      habilidades: parseJSON(p.habilidades),
      objetos: parseJSON(p.objetos),
      metodologias: parseJSON(p.metodologias),
      metodologias_recursos: parseJSON(p.metodologias_recursos),
      instrumentos: parseJSON(p.instrumentos),
      instrumentos_recursos: parseJSON(p.instrumentos_recursos),
      tipos_avaliacao: parseJSON(p.tipos_avaliacao),
    }));

    res.json(planos);
  });
});

// 🔥 FILTRO
app.get("/planos/filtro", (req, res) => {
  const { componente, ano, periodo } = req.query;

  let query = "SELECT * FROM planos WHERE 1=1";
  const params = [];

  if (componente) {
    query += " AND componente = ?";
    params.push(componente);
  }

  if (ano) {
    query += " AND ano = ?";
    params.push(ano);
  }

  if (periodo) {
    query += " AND periodo = ?";
    params.push(periodo);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const planos = rows.map(p => ({
      ...p,
      periodo: parsePeriodo(p.periodo),
      habilidades: parseJSON(p.habilidades),
      objetos: parseJSON(p.objetos),
      metodologias: parseJSON(p.metodologias),
      metodologias_recursos: parseJSON(p.metodologias_recursos),
      instrumentos: parseJSON(p.instrumentos),
      instrumentos_recursos: parseJSON(p.instrumentos_recursos),
      tipos_avaliacao: parseJSON(p.tipos_avaliacao)
    }));

    res.json(planos);
  });
});

// 🔥 BUSCAR POR ID
// 🔥 BUSCAR POR ID
app.get("/planos/:id", (req, res) => {
  db.get("SELECT * FROM planos WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) return res.status(404).json({ error: "Plano não encontrado" });

    res.json({
      ...row,
      periodo: parsePeriodo(row.periodo),
      habilidades: parseJSON(row.habilidades),
      objetos: parseJSON(row.objetos),
      metodologias: parseJSON(row.metodologias),
      metodologias_recursos: parseJSON(row.metodologias_recursos),
      instrumentos: parseJSON(row.instrumentos),
      instrumentos_recursos: parseJSON(row.instrumentos_recursos),
      tipos_avaliacao: parseJSON(row.tipos_avaliacao),
      envio_status: row.envio_status || "nao_enviado",
      professor_status: row.professor_status || "pendente"
    });

  });
});

// 🔥 ATUALIZAR (EDITAR)
app.put("/planos/:id", (req, res) => {
  const {
    professor_id,
    componente,
    ano,
    periodo,
    campo_atuacao,
    genero,
    habilidades,
    objetos,
    metodologias,
    metodologias_recursos,
    instrumentos,
    instrumentos_recursos,
    tipos_avaliacao,
    status,
    progresso
  } = req.body;

  db.run(
    `UPDATE planos SET
      professor_id = ?,
      componente = ?,
      ano = ?,
      periodo = ?,
      campo_atuacao = ?,
      genero = ?,
      habilidades = ?,
      objetos = ?,
      metodologias = ?,
      metodologias_recursos = ?,
      instrumentos = ?,
      instrumentos_recursos = ?,
      tipos_avaliacao = ?,
      status = ?,
      progresso = ?
    WHERE id = ?`,
    [
      professor_id || null,
      componente || "",
      ano || "",
      periodo || "",
      campo_atuacao || "",
      genero || "",
      JSON.stringify(habilidades || []),
      JSON.stringify(objetos || []),
      JSON.stringify(metodologias || []),
      JSON.stringify(metodologias_recursos || []),
      JSON.stringify(instrumentos || []),
      JSON.stringify(instrumentos_recursos || []),
      JSON.stringify(tipos_avaliacao || []),
      status || "rascunho",
      progresso || 0,
      req.params.id
    ],
    function (err) {
      if (err) {
        console.error("ERRO AO ATUALIZAR PLANO:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ ok: true });
    }
  );
});

// 🔥 DELETAR
app.delete("/planos/:id", (req, res) => {
  db.run("DELETE FROM planos WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/*================= BNCC =================
app.get("/bncc/:componente/:ano", (req, res) => {
  const { componente, ano } = req.params;

  const data = JSON.parse(fs.readFileSync("./bncc.json", "utf-8"));
  const disciplina = data[componente];

  if (!disciplina) return res.json({});

  const resultado = {};

  disciplina.ano.forEach((a) => {
    if (!a.nome_ano.includes(ano)) return;

    a.unidades_tematicas.forEach((unidade) => {
      if (!resultado[unidade.nome_unidade]) {
        resultado[unidade.nome_unidade] = {};
      }

      unidade.objeto_conhecimento.forEach((objeto) => {
        if (!resultado[unidade.nome_unidade][objeto.nome_objeto]) {
          resultado[unidade.nome_unidade][objeto.nome_objeto] = [];
        }

        objeto.habilidades.forEach((hab, index) => {
          const match = hab.nome_habilidade.match(/\((.*?)\)\s*(.*)/);

          resultado[unidade.nome_unidade][objeto.nome_objeto].push({
            codigo: match ? match[1] : index,
            descricao: match ? match[2] : hab.nome_habilidade,
          });
        });
      });
    });
  });

  

  res.json(resultado);
});*/
app.get("/bncc/:componente/:ano", (req, res) => {
  try {
    const { componente, ano } = req.params;
    const dados = require("./bncc.json");

    const disciplina = dados[componente];
    if (!disciplina) return res.json({});

    const anoEncontrado = disciplina.ano.find((a) =>
      a.nome_ano.includes(`${ano}º`)
    );

    if (!anoEncontrado) return res.json({});

    const resultado = {};

    anoEncontrado.unidades_tematicas.forEach((unidade) => {
      const nomeUnidade = unidade.nome_unidade;

      if (!resultado[nomeUnidade]) {
        resultado[nomeUnidade] = {};
      }

      unidade.objeto_conhecimento.forEach((obj) => {
        const nomeObjeto = obj.nome_objeto;

        if (!resultado[nomeUnidade][nomeObjeto]) {
          resultado[nomeUnidade][nomeObjeto] = [];
        }

        obj.habilidades.forEach((h) => {
          const match = h.nome_habilidade.match(/\((.*?)\)\s*(.*)/);

          const habilidade = {
            codigo: match ? match[1] : h.nome_habilidade,
            descricao: match ? match[2] : h.nome_habilidade
          };

          // 🔥 EVITA DUPLICAÇÃO
          const jaExiste = resultado[nomeUnidade][nomeObjeto].some(
            (item) => item.codigo === habilidade.codigo
          );

          if (!jaExiste) {
            resultado[nomeUnidade][nomeObjeto].push(habilidade);
          }
        });
      });
    });

    res.json(resultado);
  } catch (erro) {
    console.error("Erro BNCC:", erro);
    res.status(500).json({ error: "Erro ao carregar BNCC" });
  }
});

// ================= ROTAS PROFESSORES =================

// 🔥 LISTAR ESCOLAS
app.get("/escolas", (req, res) => {
  db.all(
    `SELECT id, nome
     FROM escolas
     ORDER BY nome ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 🔥 LISTAR COMPONENTES
app.get("/componentes", (req, res) => {
  db.all(
    `SELECT id, nome
     FROM componentes
     ORDER BY nome ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 🔥 LISTAR TURMAS
app.get("/turmas", (req, res) => {
  db.all(
    `SELECT
      id,
      ano,
      turma,
      ano || ' - Turma ' || turma AS nome
     FROM turmas
     ORDER BY ano ASC, turma ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 🔥 LISTAR PROFESSORES
app.get("/professores", (req, res) => {
  const sql = `
    SELECT
      p.id,
      p.nome,
      p.turno,
      p.email,
      p.senha,
      pa.id AS atuacao_id,
      e.id AS escola_id,
      e.nome AS escola_nome,
      c.id AS componente_id,
      c.nome AS componente_nome,
      t.id AS turma_id,
      t.ano,
      t.turma,
      t.ano || ' - Turma ' || t.turma AS turma_nome
    FROM professores p
    LEFT JOIN professor_atuacoes pa ON pa.professor_id = p.id
    LEFT JOIN escolas e ON e.id = pa.escola_id
    LEFT JOIN componentes c ON c.id = pa.componente_id
    LEFT JOIN turmas t ON t.id = pa.turma_id
    ORDER BY p.nome ASC, e.nome ASC, c.nome ASC, t.ano ASC, t.turma ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const mapa = new Map();

    rows.forEach((row) => {
      if (!mapa.has(row.id)) {
        mapa.set(row.id, {
          id: row.id,
          nome: row.nome,
          turno: row.turno,
          email: row.email,
          senha: row.senha,
          atribuicoes: []
        });
      }

      if (row.atuacao_id) {
        mapa.get(row.id).atribuicoes.push({
          id: row.atuacao_id,
          escola_id: row.escola_id,
          escola_nome: row.escola_nome,
          componente_id: row.componente_id,
          componente_nome: row.componente_nome,
          turma_id: row.turma_id,
          turma_nome: row.turma_nome
        });
      }
    });

    res.json(Array.from(mapa.values()));
  });
});

// 🔥 BUSCAR PROFESSOR POR ID
app.get("/professores/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      p.id,
      p.nome,
      p.turno,
      p.email,
      p.senha,
      pa.id AS atuacao_id,
      e.id AS escola_id,
      e.nome AS escola_nome,
      c.id AS componente_id,
      c.nome AS componente_nome,
      t.id AS turma_id,
      t.ano,
      t.turma,
      t.ano || ' - Turma ' || t.turma AS turma_nome
    FROM professores p
    LEFT JOIN professor_atuacoes pa ON pa.professor_id = p.id
    LEFT JOIN escolas e ON e.id = pa.escola_id
    LEFT JOIN componentes c ON c.id = pa.componente_id
    LEFT JOIN turmas t ON t.id = pa.turma_id
    WHERE p.id = ?
    ORDER BY e.nome ASC, c.nome ASC, t.ano ASC, t.turma ASC
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Professor não encontrado" });
    }

    const base = rows[0];

    res.json({
      id: base.id,
      nome: base.nome,
      turno: base.turno,
      email: base.email,
      senha: base.senha,
      atribuicoes: rows
        .filter((row) => row.atuacao_id)
        .map((row) => ({
          id: row.atuacao_id,
          escola_id: row.escola_id,
          escola_nome: row.escola_nome,
          componente_id: row.componente_id,
          componente_nome: row.componente_nome,
          turma_id: row.turma_id,
          turma_nome: row.turma_nome
        }))
    });
  });
});

// 🔥 CADASTRAR PROFESSOR
app.post("/professores", (req, res) => {
  const { nome, turno, email, senha, atribuicoes } = req.body;

  if (!nome || !turno || !email || !senha) {
    return res.status(400).json({ error: "Preencha nome, turno, e-mail e senha." });
  }

  if (!Array.isArray(atribuicoes) || atribuicoes.length === 0) {
    return res.status(400).json({ error: "Adicione pelo menos uma atribuição." });
  }

  db.run(
    `INSERT INTO professores (nome, turno, email, senha)
     VALUES (?, ?, ?, ?)`,
    [nome, turno, email, senha],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: professores.email")) {
          return res.status(400).json({ error: "Já existe um professor com este e-mail." });
        }
        return res.status(500).json({ error: err.message });
      }

      const professorId = this.lastID;

      inserirAtuacoesProfessor(professorId, atribuicoes, (relErr) => {
        if (relErr) return res.status(500).json({ error: relErr.message });
        res.json({ id: professorId });
      });
    }
  );
});

// 🔥 ATUALIZAR PROFESSOR
app.put("/professores/:id", (req, res) => {
  const { id } = req.params;
  const { nome, turno, email, senha, atribuicoes } = req.body;

  if (!nome || !turno || !email || !senha) {
    return res.status(400).json({ error: "Preencha nome, turno, e-mail e senha." });
  }

  if (!Array.isArray(atribuicoes) || atribuicoes.length === 0) {
    return res.status(400).json({ error: "Adicione pelo menos uma atribuição." });
  }

  db.run(
    `UPDATE professores SET
      nome = ?,
      turno = ?,
      email = ?,
      senha = ?
     WHERE id = ?`,
    [nome, turno, email, senha, id],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: professores.email")) {
          return res.status(400).json({ error: "Já existe um professor cadastrado com este e-mail." });
        }
        return res.status(500).json({ error: err.message });
      }

      limparAtuacoesProfessor(id, (deleteErr) => {
        if (deleteErr) return res.status(500).json({ error: deleteErr.message });

        inserirAtuacoesProfessor(id, atribuicoes, (finalizeErr) => {
          if (finalizeErr) return res.status(500).json({ error: finalizeErr.message });
          res.json({ ok: true });
        });
      });
    }
  );
});

// 🔥 EXCLUIR PROFESSOR
app.delete("/professores/:id", (req, res) => {
  db.run("DELETE FROM professores WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// 🔥 ENVIAR MODELO PARA PROFESSORES
app.put("/planos/:id/enviar", (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT id, componente, ano, periodo
     FROM planos
     WHERE id = ?`,
    [id],
    (err, plano) => {
      if (err) {
        console.error("ERRO AO BUSCAR PLANO:", err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!plano) {
        return res.status(404).json({ error: "Plano não encontrado." });
      }

      db.serialize(() => {
        db.run(
          `UPDATE planos
           SET envio_status = 'substituido'
           WHERE componente = ?
             AND ano = ?
             AND periodo = ?
             AND envio_status = 'enviado'
             AND id != ?`,
          [plano.componente, plano.ano, plano.periodo, id],
          function (err2) {
            if (err2) {
              console.error("ERRO AO SUBSTITUIR MODELO ANTIGO:", err2.message);
              return res.status(500).json({ error: err2.message });
            }
          }
        );

        db.run(
          `UPDATE planos
           SET envio_status = 'enviado'
           WHERE id = ?`,
          [id],
          function (err3) {
            if (err3) {
              console.error("ERRO AO ENVIAR MODELO:", err3.message);
              return res.status(500).json({ error: err3.message });
            }

            res.json({
              ok: true,
              mensagem: "Modelo enviado com sucesso."
            });
          }
        );
      });
    }
  );
});

// 🔥 LISTAR MODELOS ENVIADOS PARA O PROFESSOR LOGADO
app.get("/professores/:id/modelos", (req, res) => {
  const { id } = req.params;

  const sqlAtuacoes = `
    SELECT
      pa.professor_id,
      pa.escola_id,
      pa.componente_id,
      pa.turma_id,
      c.nome AS componente_nome,
      t.ano AS turma_ano,
      t.turma AS turma_letra
    FROM professor_atuacoes pa
    INNER JOIN componentes c ON c.id = pa.componente_id
    INNER JOIN turmas t ON t.id = pa.turma_id
    WHERE pa.professor_id = ?
  `;

  function normalizarComponente(valor) {
    return String(valor || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizarAno(valor) {
    return String(valor || "")
      .replace("º", "")
      .replace("ª", "")
      .trim();
  }

  db.all(sqlAtuacoes, [id], (err, atuacoes) => {
    if (err) {
      console.error("ERRO AO BUSCAR ATUAÇÕES DO PROFESSOR:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!atuacoes || atuacoes.length === 0) {
      return res.json([]);
    }

    db.all(
      `
      SELECT
        pl.*,
        pp.id AS plano_professor_id,
        pp.status AS professor_status
      FROM planos pl
      LEFT JOIN planos_professor pp
        ON pp.modelo_id = pl.id
       AND pp.professor_id = ?
      WHERE pl.envio_status = 'enviado'
      ORDER BY pl.id DESC
      `,
      [id],
      (err2, planos) => {
        if (err2) {
          console.error("ERRO AO BUSCAR PLANOS ENVIADOS:", err2.message);
          return res.status(500).json({ error: err2.message });
        }

        const modelosFiltrados = (planos || []).filter((plano) => {
          const componentePlano = normalizarComponente(plano.componente);
          const anoPlano = normalizarAno(plano.ano);

          return atuacoes.some((atuacao) => {
            const componenteAtuacao = normalizarComponente(atuacao.componente_nome);
            const anoAtuacao = normalizarAno(atuacao.turma_ano);

            return componenteAtuacao === componentePlano && anoAtuacao === anoPlano;
          });
        });

        const resposta = modelosFiltrados.map((p) => ({
          ...p,
          periodo: parsePeriodo(p.periodo),
          habilidades: parseJSON(p.habilidades),
          objetos: parseJSON(p.objetos),
          metodologias: parseJSON(p.metodologias),
          metodologias_recursos: parseJSON(p.metodologias_recursos),
          instrumentos: parseJSON(p.instrumentos),
          instrumentos_recursos: parseJSON(p.instrumentos_recursos),
          tipos_avaliacao: parseJSON(p.tipos_avaliacao),
          envio_status: p.envio_status || "nao_enviado",
          professor_status: p.professor_status || "pendente"
        }));

        return res.json(resposta);
      }
    );
  });
});

// 🔥 BUSCAR PLANO DO PROFESSOR A PARTIR DO MODELO
app.get("/professores/:professorId/modelos/:modeloId/plano", (req, res) => {
  const { professorId, modeloId } = req.params;

  db.get(
    `SELECT * FROM planos_professor
     WHERE professor_id = ? AND modelo_id = ?`,
    [professorId, modeloId],
    (err, planoProfessor) => {
      if (err) {
        console.error("ERRO AO BUSCAR PLANO DO PROFESSOR:", err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!planoProfessor) {
        return res.json(null);
      }

      res.json({
        ...planoProfessor,
        habilidades: parseJSON(planoProfessor.habilidades),
        objetos: parseJSON(planoProfessor.objetos),
        metodologias: parseJSON(planoProfessor.metodologias),
        metodologias_recursos: parseJSON(planoProfessor.metodologias_recursos),
        instrumentos: parseJSON(planoProfessor.instrumentos),
        instrumentos_recursos: parseJSON(planoProfessor.instrumentos_recursos),
        tipos_avaliacao: parseJSON(planoProfessor.tipos_avaliacao),
        generos: parseJSON(planoProfessor.generos)
      });
    }
  );
});

// PLANO DO PROFESSOR
app.get("/planos-professor", (req, res) => {
  db.all(
    `
    SELECT 
      id,
      professor_id,
      modelo_id,
      status
    FROM planos_professor
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error("ERRO AO LISTAR PLANOS DO PROFESSOR:", err.message);
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// COORDENADOR
app.get("/dashboard/coordenador", (req, res) => {
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
    return String(valor || "")
      .replace(/º/g, "")
      .replace(/ª/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  function normalizarStatus(valor) {
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function statusEhConcluido(valor) {
    const s = normalizarStatus(valor);
    return s === "concluido" || s === "finalizado" || s === "enviado";
  }

  function statusEhAndamento(valor) {
    const s = normalizarStatus(valor);
    return (
      s === "em_andamento" ||
      s === "em andamento" ||
      s === "andamento" ||
      s === "rascunho"
    );
  }

  function statusEhPendente(valor) {
    const s = normalizarStatus(valor);
    return s === "pendente" || s === "nao iniciado" || s === "nao_iniciado" || s === "";
  }

  const sqlProfessores = `
    SELECT
      p.id,
      p.nome,
      pa.componente_id,
      pa.turma_id,
      c.nome AS componente_nome,
      t.ano AS turma_ano
    FROM professores p
    LEFT JOIN professor_atuacoes pa ON pa.professor_id = p.id
    LEFT JOIN componentes c ON c.id = pa.componente_id
    LEFT JOIN turmas t ON t.id = pa.turma_id
    ORDER BY p.nome ASC
  `;

  const sqlModelos = `
    SELECT
      id,
      componente,
      ano,
      periodo,
      envio_status
    FROM planos
    WHERE envio_status = 'enviado'
    ORDER BY id DESC
  `;

  const sqlPlanosProfessor = `
    SELECT
      id,
      professor_id,
      modelo_id,
      status
    FROM planos_professor
  `;

  db.all(sqlProfessores, [], (err, rowsProfessores) => {
    if (err) {
      console.error("ERRO AO BUSCAR PROFESSORES DO DASHBOARD:", err.message);
      return res.status(500).json({ error: err.message });
    }

    db.all(sqlModelos, [], (err2, modelosEnviados) => {
      if (err2) {
        console.error("ERRO AO BUSCAR MODELOS ENVIADOS:", err2.message);
        return res.status(500).json({ error: err2.message });
      }

      db.all(sqlPlanosProfessor, [], (err3, planosProfessor) => {
        if (err3) {
          console.error("ERRO AO BUSCAR PLANOS DO PROFESSOR:", err3.message);
          return res.status(500).json({ error: err3.message });
        }

        const mapaProfessores = new Map();

        (rowsProfessores || []).forEach((row) => {
          if (!mapaProfessores.has(row.id)) {
            mapaProfessores.set(row.id, {
              id: row.id,
              nome: row.nome,
              atribuicoes: []
            });
          }

          if (row.componente_id && row.turma_id) {
            mapaProfessores.get(row.id).atribuicoes.push({
              componente_nome: row.componente_nome,
              turma_ano: row.turma_ano
            });
          }
        });

        const resposta = Array.from(mapaProfessores.values()).map((professor) => {
          const modelosCompativeis = [];
          const idsJaAdicionados = new Set();

          (modelosEnviados || []).forEach((modelo) => {
            const componenteModelo = normalizarTexto(modelo.componente);
            const anoModelo = normalizarAno(modelo.ano);

            const compativel = (professor.atribuicoes || []).some((atribuicao) => {
              const componenteAtribuicao = normalizarTexto(atribuicao.componente_nome);
              const anoAtribuicao = normalizarAno(atribuicao.turma_ano);

              return (
                componenteAtribuicao === componenteModelo &&
                anoAtribuicao === anoModelo
              );
            });

            if (compativel && !idsJaAdicionados.has(modelo.id)) {
              idsJaAdicionados.add(modelo.id);
              modelosCompativeis.push(modelo);
            }
          });

          const modelosComStatus = modelosCompativeis.map((modelo) => {
            const planoDoProfessor = (planosProfessor || []).find((pp) => {
              return (
                Number(pp.professor_id) === Number(professor.id) &&
                Number(pp.modelo_id) === Number(modelo.id)
              );
            });

            return {
              ...modelo,
              professor_status: planoDoProfessor?.status || "pendente"
            };
          });

          const total = modelosComStatus.length;

          const concluidos = modelosComStatus.filter((item) =>
            statusEhConcluido(item.professor_status)
          ).length;

          const andamento = modelosComStatus.filter((item) =>
            statusEhAndamento(item.professor_status)
          ).length;

          const pendentes = modelosComStatus.filter((item) =>
            statusEhPendente(item.professor_status)
          ).length;

          const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

          return {
            id: professor.id,
            nome: professor.nome,
            total,
            concluidos,
            andamento,
            pendentes,
            percentual
          };
        });

        res.json(resposta);
      });
    });
  });
});

// SALVAR PLANO DO PROFESSOR
app.post("/professores/:professorId/modelos/:modeloId/plano", (req, res) => {
  const { professorId, modeloId } = req.params;
  const {
    componente,
    ano,
    periodo,
    campo_atuacao,
    generos,
    habilidades,
    objetos,
    metodologias,
    instrumentos,
    instrumentos_recursos,
    tipos_avaliacao,
    metodologias_recursos,
    observacoes,
    status
  } = req.body;

  db.get(
    `SELECT id FROM planos_professor
     WHERE professor_id = ? AND modelo_id = ?`,
    [professorId, modeloId],
    (err, existente) => {
      if (err) {
        console.error("ERRO AO VERIFICAR PLANO DO PROFESSOR:", err.message);
        return res.status(500).json({ error: err.message });
      }

      if (existente) {
        db.run(
          `UPDATE planos_professor SET
            componente = ?,
            ano = ?,
            periodo = ?,
            campo_atuacao = ?,
            generos = ?,
            habilidades = ?,
            objetos = ?,
            metodologias = ?,
            metodologias_recursos = ?,
            instrumentos = ?,
            instrumentos_recursos = ?,
            tipos_avaliacao = ?,
            observacoes = ?,
            status = ?,
            atualizado_em = CURRENT_TIMESTAMP
           WHERE professor_id = ? AND modelo_id = ?`,
          [
            componente || "",
            ano || "",
            periodo || "",
            campo_atuacao || "",
            JSON.stringify(generos || []),
            JSON.stringify(habilidades || []),
            JSON.stringify(objetos || []),
            JSON.stringify(metodologias || []),
            JSON.stringify(metodologias_recursos || []),
            JSON.stringify(instrumentos || []),
            JSON.stringify(instrumentos_recursos || []),
            JSON.stringify(tipos_avaliacao || []),
            observacoes || "",
            status || "em_andamento",
            professorId,
            modeloId
          ],
          function (err2) {
            if (err2) {
              console.error("ERRO AO ATUALIZAR PLANO DO PROFESSOR:", err2.message);
              return res.status(500).json({ error: err2.message });
            }

            res.json({
              ok: true,
              mensagem: "Plano do professor atualizado com sucesso."
            });
          }
        );
      } else {
        db.run(
          `INSERT INTO planos_professor (
            modelo_id,
            professor_id,
            componente,
            ano,
            periodo,
            campo_atuacao,
            generos,
            habilidades,
            objetos,
            metodologias,
            metodologias_recursos,
            instrumentos,
            instrumentos_recursos,
            tipos_avaliacao,
            observacoes,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            modeloId,
            professorId,
            componente || "",
            ano || "",
            periodo || "",
            campo_atuacao || "",
            JSON.stringify(generos || []),
            JSON.stringify(habilidades || []),
            JSON.stringify(objetos || []),
            JSON.stringify(metodologias || []),
            JSON.stringify(metodologias_recursos || []),
            JSON.stringify(instrumentos || []),
            JSON.stringify(instrumentos_recursos || []),
            JSON.stringify(tipos_avaliacao || []),
            observacoes || "",
            status || "em_andamento"
          ],
          function (err4) {
            if (err4) {
              console.error("ERRO AO CRIAR PLANO DO PROFESSOR:", err4.message);
              return res.status(500).json({ error: err4.message });
            }

            res.json({
              ok: true,
              mensagem: "Plano do professor salvo com sucesso.",
              id: this.lastID
            });
          }
        );
      }
    }
  );
});
// ================= START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});