const db = require("./database");

const escolasPadrao = [
    "UNIDADE ESCOLAR PROFESSORA ORDALINDA FREITAS",
    "UNIDADE ESCOLAR SÃO BENEDITO",
    "UNIDADE ESCOLAR SONHO DOURADO",
    "UNIDADE INTEGRADA VILA DOURADO",
    "UNIDADE RURAL DE 1º GRAU DORALICE DOURADO",
    "UNIDADE INTEGRADA VER. LAÉRCIO FERNANDES DE OLIVEIRA",
    "UNIDADE INTEGRADA MOACIR HERÁCLITO DOS REMÉDIOS",
    "CENTRO DE REFER. EDUCACIONAL PROFª MARIA VALDIONICE PEREIRA DA SILVA",
    "ESCOLA MUNICIPAL MAXIMILIANO GONÇALVES TEIXEIRA",
    "ESCOLA MUNICIPAL JOSÉ SEBASTIÃO TAVARES",
    "ESCOLA MUNICIPAL PROFª MARIA IZABEL MAIA CHAGAS",
    "ESCOLA MUNICIPAL ALMIRANTE BARROSO",
    "UNIDADE ESCOLAR JOÃO PAULO II",
    "UNIDADE ESCOLAR PROFESSOR MILTON MAIA",
    "UNIDADE ESCOLAR ADILSON DOURADO",
    "UNIDADE INTEGRADA VER. OTAVIO LAURO CORREA",
    "UNIDADE INTEGRADA VER. YOLANDA DOURADO",
    "ESCOLA MUNICIPAL PROFª GEORGINA BORGES RIBEIRO",
    "ESCOLA MUNICIPAL ANTONIO DE OLIVEIRA LIMA",
    "ESCOLA MUNICIPAL LUIZA LIMA DE ARAUJO",
    "ESCOLA MUNICIPAL OLIMPIA FERNANDES OLIVEIRA",
    "UNIDADE ESCOLAR SÃO LOURENÇO",
    "UNIDADE ESCOLA TANCREDO NEVES",
    "ESCOLA MUNICIPAL AGRIPINO PAMPLONA DE MENEZES",
    "ESCOLA MUNICIPAL CICILIO MOREIRA DA SILVA",
    "UNIDADE ESCOLAR HUMBERTO DE CAMPOS",
    "UNIDADE ESCOLA PROFª ELZA COSTA DA SILVA",
    "ESCOLA MUNICIPAL DANTAS DOURADO",
    "UNIDADE ESCOLAR DUQUE DE CAXIAS",
    "ESCOLA MUNICIPAL RUI BARBOSA",
    "ESCOLA MUNICIPAL OTAVIANO REIS"

];

const componentesPadrao = [
    "Língua Portuguesa",
    "LP - Eixo de Leitura e Oralidade",
    "LP - Eixo de Produção de Texto / Oralidade",
    "LP - Eixo de Análise Linguística e Semiótica",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Matemática",
    "Ciências",
    "Geografia",
    "História",
    "Ensino Religioso",
    "Computação" 
];

const anosPadrao = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º"];
const letrasTurmaPadrao = ["A", "B", "C", "D", "E", "F", "G"];

db.serialize(() => {
    const stmtEscolas = db.prepare(`
    INSERT OR IGNORE INTO escolas (nome) VALUES (?)
  `);

    escolasPadrao.forEach((nome) => {
        stmtEscolas.run(nome);
    });

    stmtEscolas.finalize();

    const stmtComponentes = db.prepare(`
    INSERT OR IGNORE INTO componentes (nome) VALUES (?)
  `);

    componentesPadrao.forEach((nome) => {
        stmtComponentes.run(nome);
    });

    stmtComponentes.finalize();

    const stmtTurmas = db.prepare(`
    INSERT OR IGNORE INTO turmas (ano, turma) VALUES (?, ?)
  `);

    anosPadrao.forEach((ano) => {
        letrasTurmaPadrao.forEach((turma) => {
            stmtTurmas.run(ano, turma);
        });
    });

    stmtTurmas.finalize((err) => {
        if (err) {
            console.error("Erro ao inserir turmas:", err.message);
            return;
        }

        console.log("Seed executado com sucesso.");
        db.close();
    });
});