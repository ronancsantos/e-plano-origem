const express = require("express");
const router = express.Router();
const db = require("../database");

// =========================
// LISTAS AUXILIARES
// =========================

router.get("/escolas", (req, res) => {
  db.all(
    `SELECT id, nome
     FROM escolas
     ORDER BY nome ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json(rows);
    }
  );
});

router.get("/componentes", (req, res) => {
  db.all(
    `SELECT id, nome
     FROM componentes
     ORDER BY nome ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json(rows);
    }
  );
});

router.get("/turmas", (req, res) => {
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
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json(rows);
    }
  );
});

// =========================
// FUNÇÕES AUXILIARES
// =========================

function formatarLista(valor) {
  if (!valor) return [];

  return valor.split(",").map((item) => {
    const partes = item.split("|");
    const id = Number(partes[0]);
    const nome = partes.slice(1).join("|");
    return { id, nome };
  });
}

function limparRelacoesProfessor(professorId, callback) {
  db.serialize(() => {
    db.run(`DELETE FROM professor_escolas WHERE professor_id = ?`, [professorId]);
    db.run(`DELETE FROM professor_componentes WHERE professor_id = ?`, [professorId]);
    db.run(`DELETE FROM professor_turmas WHERE professor_id = ?`, [professorId], callback);
  });
}

function inserirRelacoesProfessor(professorId, escolas, componentes, turmas, callback) {
  db.serialize(() => {
    const stmtEscolas = db.prepare(`
      INSERT INTO professor_escolas (professor_id, escola_id)
      VALUES (?, ?)
    `);

    (escolas || []).forEach((escolaId) => {
      stmtEscolas.run(professorId, escolaId);
    });

    stmtEscolas.finalize();

    const stmtComponentes = db.prepare(`
      INSERT INTO professor_componentes (professor_id, componente_id)
      VALUES (?, ?)
    `);

    (componentes || []).forEach((componenteId) => {
      stmtComponentes.run(professorId, componenteId);
    });

    stmtComponentes.finalize();

    const stmtTurmas = db.prepare(`
      INSERT INTO professor_turmas (professor_id, turma_id)
      VALUES (?, ?)
    `);

    (turmas || []).forEach((turmaId) => {
      stmtTurmas.run(professorId, turmaId);
    });

    stmtTurmas.finalize(callback);
  });
}

// =========================
// LISTAR PROFESSORES
// =========================

router.get("/professores", (req, res) => {
  const sql = `
    SELECT
      p.id,
      p.nome,
      p.turno,
      p.email,
      p.senha,
      GROUP_CONCAT(DISTINCT e.id || '|' || e.nome) AS escolas,
      GROUP_CONCAT(DISTINCT c.id || '|' || c.nome) AS componentes,
      GROUP_CONCAT(DISTINCT t.id || '|' || t.ano || ' - Turma ' || t.turma) AS turmas
    FROM professores p
    LEFT JOIN professor_escolas pe ON pe.professor_id = p.id
    LEFT JOIN escolas e ON e.id = pe.escola_id
    LEFT JOIN professor_componentes pc ON pc.professor_id = p.id
    LEFT JOIN componentes c ON c.id = pc.componente_id
    LEFT JOIN professor_turmas pt ON pt.professor_id = p.id
    LEFT JOIN turmas t ON t.id = pt.turma_id
    GROUP BY p.id
    ORDER BY p.nome ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    const resultado = rows.map((prof) => ({
      id: prof.id,
      nome: prof.nome,
      turno: prof.turno,
      email: prof.email,
      senha: prof.senha,
      escolas: formatarLista(prof.escolas),
      componentes: formatarLista(prof.componentes),
      turmas: formatarLista(prof.turmas)
    }));

    res.json(resultado);
  });
});

// =========================
// BUSCAR PROFESSOR POR ID
// =========================

router.get("/professores/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      p.id,
      p.nome,
      p.turno,
      p.email,
      p.senha,
      GROUP_CONCAT(DISTINCT e.id || '|' || e.nome) AS escolas,
      GROUP_CONCAT(DISTINCT c.id || '|' || c.nome) AS componentes,
      GROUP_CONCAT(DISTINCT t.id || '|' || t.ano || ' - Turma ' || t.turma) AS turmas
    FROM professores p
    LEFT JOIN professor_escolas pe ON pe.professor_id = p.id
    LEFT JOIN escolas e ON e.id = pe.escola_id
    LEFT JOIN professor_componentes pc ON pc.professor_id = p.id
    LEFT JOIN componentes c ON c.id = pc.componente_id
    LEFT JOIN professor_turmas pt ON pt.professor_id = p.id
    LEFT JOIN turmas t ON t.id = pt.turma_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (!row) {
      return res.status(404).json({ erro: "Professor não encontrado." });
    }

    res.json({
      id: row.id,
      nome: row.nome,
      turno: row.turno,
      email: row.email,
      senha: row.senha,
      escolas: formatarLista(row.escolas),
      componentes: formatarLista(row.componentes),
      turmas: formatarLista(row.turmas)
    });
  });
});

// =========================
// CADASTRAR PROFESSOR
// =========================

router.post("/professores", (req, res) => {
  const { nome, turno, email, senha, escolas, componentes, turmas } = req.body;

  if (!nome || !turno || !email || !senha) {
    return res.status(400).json({ erro: "Preencha nome, turno, e-mail e senha." });
  }

  if (!Array.isArray(escolas) || escolas.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos uma escola." });
  }

  if (!Array.isArray(componentes) || componentes.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos um componente." });
  }

  if (!Array.isArray(turmas) || turmas.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos uma turma." });
  }

  db.run(
    `INSERT INTO professores (nome, turno, email, senha)
     VALUES (?, ?, ?, ?)`,
    [nome, turno, email, senha],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: professores.email")) {
          return res.status(400).json({ erro: "Já existe um professor cadastrado com este e-mail." });
        }
        return res.status(500).json({ erro: err.message });
      }

      const professorId = this.lastID;

      inserirRelacoesProfessor(
        professorId,
        escolas,
        componentes,
        turmas,
        (finalizeErr) => {
          if (finalizeErr) {
            return res.status(500).json({ erro: finalizeErr.message });
          }

          res.json({
            mensagem: "Professor cadastrado com sucesso.",
            id: professorId
          });
        }
      );
    }
  );
});

// =========================
// ATUALIZAR PROFESSOR
// =========================

router.put("/professores/:id", (req, res) => {
  const { id } = req.params;
  const { nome, turno, email, senha, escolas, componentes, turmas } = req.body;

  if (!nome || !turno || !email || !senha) {
    return res.status(400).json({ erro: "Preencha nome, turno, e-mail e senha." });
  }

  if (!Array.isArray(escolas) || escolas.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos uma escola." });
  }

  if (!Array.isArray(componentes) || componentes.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos um componente." });
  }

  if (!Array.isArray(turmas) || turmas.length === 0) {
    return res.status(400).json({ erro: "Selecione pelo menos uma turma." });
  }

  db.run(
    `UPDATE professores
     SET nome = ?, turno = ?, email = ?, senha = ?
     WHERE id = ?`,
    [nome, turno, email, senha, id],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed: professores.email")) {
          return res.status(400).json({ erro: "Já existe um professor cadastrado com este e-mail." });
        }
        return res.status(500).json({ erro: err.message });
      }

      limparRelacoesProfessor(id, (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ erro: deleteErr.message });
        }

        inserirRelacoesProfessor(
          id,
          escolas,
          componentes,
          turmas,
          (finalizeErr) => {
            if (finalizeErr) {
              return res.status(500).json({ erro: finalizeErr.message });
            }

            res.json({ mensagem: "Professor atualizado com sucesso." });
          }
        );
      });
    }
  );
});

// =========================
// EXCLUIR PROFESSOR
// =========================

router.delete("/professores/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM professores WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    res.json({ mensagem: "Professor excluído com sucesso." });
  });
});

module.exports = router;