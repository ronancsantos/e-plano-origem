const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const path = require("path");

// Load .env from backend directory
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addEnvioStatusColumn() {
  try {
    console.log("Adicionando coluna envio_status à tabela planos...");

    const { error } = await supabase.rpc("sql", {
      query: `
        ALTER TABLE planos
        ADD COLUMN IF NOT EXISTS envio_status VARCHAR(50) DEFAULT 'nao_enviado';
        
        CREATE INDEX IF NOT EXISTS idx_planos_envio_status ON planos(envio_status);
        
        UPDATE planos 
        SET envio_status = 'nao_enviado' 
        WHERE envio_status IS NULL;
      `
    });

    if (error) {
      console.error("Erro ao executar SQL:", error);
      return;
    }

    console.log("✅ Coluna envio_status adicionada com sucesso!");
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

addEnvioStatusColumn();
