const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

// 🔥 carrega JSON
const data = JSON.parse(fs.readFileSync("./bncc.json", "utf-8"));

// 🔁 percorre disciplinas
Object.keys(data).forEach((disciplinaKey) => {
  const disciplina = data[disciplinaKey];

  const nomeDisciplina = disciplina.nome_disciplina;

  disciplina.ano.forEach((anoObj) => {
    const ano = anoObj.nome_ano[0]; // ex: "1º"

    anoObj.unidades_tematicas.forEach((unidade) => {
      // 👉 INSERE UNIDADE
      db.run(
        `INSERT INTO unidades (nome, componente, ano) VALUES (?, ?, ?)`,
        [unidade.nome_unidade, nomeDisciplina, ano],
        function (err) {
          if (err) return console.log(err);

          const unidadeId = this.lastID;

          unidade.objeto_conhecimento.forEach((objeto) => {
            // 👉 INSERE OBJETO
            db.run(
              `INSERT INTO objetos (nome, unidade_id) VALUES (?, ?)`,
              [objeto.nome_objeto, unidadeId],
              function (err) {
                if (err) return console.log(err);

                const objetoId = this.lastID;

                objeto.habilidades.forEach((hab) => {
                  // 🔥 separa código e descrição
                  const match = hab.nome_habilidade.match(/\((.*?)\)\s*(.*)/);

                  const codigo = match ? match[1] : "";
                  const descricao = match ? match[2] : hab.nome_habilidade;

                  // 👉 INSERE HABILIDADE
                  db.run(
                    `INSERT INTO habilidades_bncc (codigo, descricao, objeto_id)
                     VALUES (?, ?, ?)`,
                    [codigo, descricao, objetoId]
                  );
                });
              }
            );
          });
        }
      );
    });
  });
});

console.log(" BNCC importada com sucesso!");