const app = require("./server");
const { startSupabaseKeepAlive } = require("./supabaseKeepAlive");

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Servidor local ativo em http://127.0.0.1:${PORT}`);
});

const stopSupabaseKeepAlive = startSupabaseKeepAlive();
server.on("close", stopSupabaseKeepAlive);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`A porta ${PORT} ja esta em uso. Encerre o processo anterior e tente novamente.`);
  } else {
    console.error("Falha ao iniciar o servidor local:", error);
  }
  process.exitCode = 1;
});

const encerrar = (signal) => {
  console.log(`\n${signal} recebido. Encerrando o servidor local...`);
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => encerrar("SIGINT"));
process.on("SIGTERM", () => encerrar("SIGTERM"));
