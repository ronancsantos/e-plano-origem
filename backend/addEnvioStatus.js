const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addEnvioStatusColumn() {
  try {
    console.log("Iniciando migração: Adicionando coluna 'envio_status' à tabela 'planos'...");

    const { error } = await supabase.rpc("execute_sql", {
      sql: `
        ALTER TABLE planos
        ADD COLUMN IF NOT EXISTS envio_status TEXT DEFAULT 'nao_enviado';
        
        COMMENT ON COLUMN planos.envio_status IS 'Status do envio do plano: nao_enviado, enviado, substituido';
      `
    });

    if (error) {
      // Tenta execução direta via SQL
      const { data, error: directError } = await supabase.from("_sql_execution").insert({
        query: `
          ALTER TABLE planos
          ADD COLUMN IF NOT EXISTS envio_status TEXT DEFAULT 'nao_enviado';
        `
      });

      if (directError) {
        console.error("❌ Erro ao adicionar coluna:", directError.message);
        console.log("\n⚠️  Execute manualmente no SQL Editor do Supabase:");
        console.log(`
          ALTER TABLE planos
          ADD COLUMN IF NOT EXISTS envio_status TEXT DEFAULT 'nao_enviado';
        `);
        return;
      }
    }

    console.log("✅ Coluna 'envio_status' adicionada com sucesso!");

    // Verifica se a coluna foi criada
    const { data: columns } = await supabase.rpc("information_schema.columns", {
      table_name: "planos"
    });

    console.log("✅ Migração concluída!");

  } catch (error) {
    console.error("❌ Erro durante a migração:", error.message);
    console.log("\n⚠️  Execute manualmente no SQL Editor do Supabase:");
    console.log(`
      ALTER TABLE planos
      ADD COLUMN IF NOT EXISTS envio_status TEXT DEFAULT 'nao_enviado';
    `);
  }
}

addEnvioStatusColumn();
