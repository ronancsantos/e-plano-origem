const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./banco.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS planos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id TEXT,
      componente TEXT,
      ano TEXT,
      periodo TEXT,
      campo_atuacao TEXT,
      genero TEXT,
      habilidades TEXT,
      objetos TEXT,
      metodologias TEXT,
      instrumentos TEXT,
      tipos_avaliacao TEXT,
      status TEXT,
      progresso INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modelos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      componente TEXT,
      ano TEXT,
      periodo TEXT,
      campo_atuacao TEXT,
      genero TEXT,
      habilidades TEXT,
      objetos TEXT,
      metodologias TEXT,
      instrumentos TEXT,
      tipos_avaliacao TEXT
    )
  `);

  db.run(`
CREATE TABLE IF NOT EXISTS unidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  componente TEXT,
  ano TEXT
)
`);

  db.run(`
CREATE TABLE IF NOT EXISTS objetos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  unidade_id INTEGER
)
`);

  db.run(`
CREATE TABLE IF NOT EXISTS habilidades_bncc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT,
  descricao TEXT,
  objeto_id INTEGER
)
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS professores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      turno TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS escolas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ano TEXT NOT NULL,
      turma TEXT NOT NULL,
      UNIQUE(ano, turma)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS professor_escolas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER NOT NULL,
      escola_id INTEGER NOT NULL,
      FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
      FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS professor_componentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER NOT NULL,
      componente_id INTEGER NOT NULL,
      FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
      FOREIGN KEY (componente_id) REFERENCES componentes(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS professor_turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      professor_id INTEGER NOT NULL,
      turma_id INTEGER NOT NULL,
      FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE,
      FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK(perfil IN ('admin','secretarioDeEducacao','coordenador', 'gestorEscolar', 'professor','')),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

  console.log("Tabelas criadas com sucesso.");
});

module.exports = db;