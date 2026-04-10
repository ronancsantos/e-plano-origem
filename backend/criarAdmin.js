const bcrypt = require("bcryptjs");
const db = require("./database.js");

async function criarAdmin() {
  const nome = "Ronan Santos";
  const email = "admin@gmail.com";
  const senha = "123456";
  const perfil = "admin";

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, user) => {
      if (err) {
        console.error("Erro ao verificar administrador:", err.message);
        db.close();
        return;
      }

      if (user) {
        console.log("Administrador já existe.");
        db.close();
        return;
      }

      db.run(
        `INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)`,
        [nome, email, senhaHash, perfil],
        function (err) {
          if (err) {
            console.error("Erro ao criar administrador:", err.message);
          } else {
            console.log("Administrador criado com sucesso!");
            console.log("Email:", email);
            console.log("Senha:", senha);
          }

          db.close();
        }
      );
    });
  } catch (error) {
    console.error("Erro interno ao criar administrador.");
    db.close();
  }
}

criarAdmin();