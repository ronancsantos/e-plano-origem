import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const api = require("./backend/server.js");
const { startSupabaseKeepAlive } = require("./backend/supabaseKeepAlive.js");
const app = express();
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: "same-site" }
}));

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

const stopSupabaseKeepAlive = startSupabaseKeepAlive();
server.on("close", stopSupabaseKeepAlive);

server.on("error", (error) => {
  console.error("Falha ao iniciar o E-Plano:", error);
  process.exitCode = 1;
});

export default app;
