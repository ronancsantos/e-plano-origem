const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const supabase = require("../supabase");

const router = express.Router();

const SECRET = process.env.JWT_SECRET || "seu_segredo_super_seguro";

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
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha." });
  }

  try {
    // USUÁRIOS
    let { data: usuario, error: errUsuario } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (errUsuario) return res.status(500).json({ erro: errUsuario.message });

    if (usuario) {
      let passwordMatches = false;

      try {
        if (typeof usuario.senha === 'string' && usuario.senha.startsWith('$2')) {
          passwordMatches = await bcrypt.compare(senha, usuario.senha);
        } else {
          // support existing plaintext passwords: if match, rehash and update
          passwordMatches = usuario.senha === senha;
          if (passwordMatches) {
            const hashed = await bcrypt.hash(senha, 10);
            await supabase.from('usuarios').update({ senha: hashed }).eq('id', usuario.id);
            usuario.senha = hashed;
          }
        }
      } catch (e) {
        return res.status(500).json({ erro: 'Erro ao validar senha.' });
      }

      if (!passwordMatches) {
        return res.status(401).json({ erro: "Senha inválida." });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          tipo: usuario.perfil
        },
        SECRET,
        { expiresIn: "1d" }
      );

      return res.json({ token, usuario });
    }

    // PROFESSORES
    let { data: professor, error: errProfessor } = await supabase
      .from("professores")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (errProfessor) return res.status(500).json({ erro: errProfessor.message });

    if (!professor) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    try {
      let passwordMatches = false;
      if (typeof professor.senha === 'string' && professor.senha.startsWith('$2')) {
        passwordMatches = await bcrypt.compare(senha, professor.senha);
      } else {
        passwordMatches = professor.senha === senha;
        if (passwordMatches) {
          const hashed = await bcrypt.hash(senha, 10);
          await supabase.from('professores').update({ senha: hashed }).eq('id', professor.id);
          professor.senha = hashed;
        }
      }
      if (!passwordMatches) return res.status(401).json({ erro: "Senha inválida." });
    } catch (e) {
      return res.status(500).json({ erro: 'Erro ao validar senha.' });
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
        ...professor,
        perfil: "professor",
        tipo: "professor"
      }
    });

  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
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
router.post("/register", autenticarToken, async (req, res) => {
  const { nome, email, senha, tipo, perfil } = req.body;

  const tipoFinal = tipo || perfil;

  if (!nome || !email || !senha || !tipoFinal) {
    return res.status(400).json({
      erro: "Preencha nome, e-mail, senha e tipo."
    });
  }

  if (
    tipoFinal !== "admin" &&
    tipoFinal !== "coordenador"
  ) {
    return res.status(400).json({
      erro: "Nesta tela só é permitido cadastrar admin ou coordenador."
    });
  }

  if (req.usuario.perfil !== "admin") {
    return res.status(403).json({
      erro: "Apenas administradores podem cadastrar usuários."
    });
  }

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existente) {
    return res.status(400).json({
      erro: "Já existe um usuário com este e-mail."
    });
  }

  const { data, error } = await supabase
    .from("usuarios")
    .insert([
      {
        nome,
        email,
        senha: await bcrypt.hash(senha, 10),
        perfil: tipoFinal
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  return res.json({
    mensagem: "Usuário cadastrado com sucesso.",
    usuario: {
      id: data.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      tipo: data.perfil
    }
  });
});

// ============================
// LISTAR USUÁRIOS
// ============================
router.get("/usuarios", autenticarToken, async (req, res) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nome,email,perfil")
    .order("nome");

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  res.json(
    data.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      tipo: u.perfil
    }))
  );
});

// ============================
// DELETAR USUÁRIO
// ============================
router.delete("/usuarios/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  if (req.usuario.perfil !== "admin") {
    return res.status(403).json({
      erro: "Apenas administradores podem excluir usuários."
    });
  }

  if (Number(req.usuario.id) === Number(id)) {
    return res.status(400).json({
      erro: "Você não pode excluir seu próprio usuário."
    });
  }

  const { error } = await supabase
    .from("usuarios")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  res.json({
    mensagem: "Usuário removido com sucesso."
  });
});

module.exports = router;
