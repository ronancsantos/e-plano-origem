import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const api = require("./backend/server.js");
const app = express();
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");

// A API fica no mesmo deploy e dominio do frontend.
app.use("/api", api);

app.use(express.static(distDir, { index: false }));
app.get("*splat", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`E-Plano ativo na porta ${port}`);
});

server.on("error", (error) => {
  console.error("Falha ao iniciar o E-Plano:", error);
  process.exitCode = 1;
});

export default app;
