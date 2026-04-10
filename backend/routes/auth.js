const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../database");

const router = express.Router();

const SECRET = "seu_segredo_super_seguro";

// ============================
// MIDDLEWARE DE TOKEN
// ============================
function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não informado." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido." });
  }
}

// ============================
// LOGIN
// ============================
router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha." });
  }

  db.get(
    `SELECT id, nome, email, senha, perfil
     FROM usuarios
     WHERE email = ?`,
    [email],
    (err, usuario) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (usuario) {
        if (usuario.senha !== senha) {
          return res.status(401).json({ erro: "Senha inválida." });
        }

        const perfil = usuario.perfil || "coordenador";

        const token = jwt.sign(
          {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil,
            tipo: perfil
          },
          SECRET,
          { expiresIn: "1d" }
        );

        return res.json({
          token,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil,
            tipo: perfil
          }
        });
      }

      db.get(
        `SELECT id, nome, email, senha, turno
         FROM professores
         WHERE email = ?`,
        [email],
        (err2, professor) => {
          if (err2) {
            return res.status(500).json({ erro: err2.message });
          }

          if (!professor) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
          }

          if (professor.senha !== senha) {
            return res.status(401).json({ erro: "Senha inválida." });
          }

          const token = jwt.sign(
            {
              id: professor.id,
              nome: professor.nome,
              email: professor.email,
              perfil: "professor",
              tipo: "professor"
            },
            SECRET,
            { expiresIn: "1d" }
          );

          return res.json({
            token,
            usuario: {
              id: professor.id,
              nome: professor.nome,
              email: professor.email,
              turno: professor.turno,
              perfil: "professor",
              tipo: "professor"
            }
          });
        }
      );
    }
  );
});

// ============================
// USUÁRIO LOGADO
// ============================
router.get("/me", autenticarToken, (req, res) => {
  res.json(req.usuario);
});

// ============================
// CADASTRAR USUÁRIO
// APENAS admin e coordenador
// ============================
router.post("/register", autenticarToken, (req, res) => {
  const { nome, email, senha, tipo, perfil } = req.body;

  const tipoFinal = tipo || perfil;

  if (!nome || !email || !senha || !tipoFinal) {
    return res.status(400).json({ erro: "Preencha nome, e-mail, senha e tipo." });
  }

  if (tipoFinal !== "admin" && tipoFinal !== "coordenador") {
    return res.status(400).json({ erro: "Nesta tela só é permitido cadastrar admin ou coordenador." });
  }

  if (req.usuario.perfil !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores podem cadastrar usuários." });
  }

  db.run(
    `INSERT INTO usuarios (nome, email, senha, perfil)
     VALUES (?, ?, ?, ?)`,
    [nome, email, senha, tipoFinal],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ erro: "Já existe um usuário com este e-mail." });
        }

        return res.status(500).json({ erro: err.message });
      }

      return res.json({
        mensagem: "Usuário cadastrado com sucesso.",
        usuario: {
          id: this.lastID,
          nome,
          email,
          perfil: tipoFinal,
          tipo: tipoFinal
        }
      });
    }
  );
});

// ============================
// LISTAR USUÁRIOS
// ============================
router.get("/usuarios", autenticarToken, (req, res) => {
  db.all(
    `SELECT id, nome, email, perfil
     FROM usuarios
     ORDER BY nome ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      const usuarios = rows.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        tipo: u.perfil
      }));

      res.json(usuarios);
    }
  );
});

// ============================
// DELETAR USUÁRIO
// ============================
router.delete("/usuarios/:id", autenticarToken, (req, res) => {
  const { id } = req.params;

  if (req.usuario.perfil !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores podem excluir usuários." });
  }

  if (Number(req.usuario.id) === Number(id)) {
    return res.status(400).json({ erro: "Você não pode excluir seu próprio usuário." });
  }

  db.run(`DELETE FROM usuarios WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res.json({ mensagem: "Usuário removido com sucesso." });
  });
});

module.exports = router;