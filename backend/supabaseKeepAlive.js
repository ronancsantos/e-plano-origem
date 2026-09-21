const supabase = require("./supabase");

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

const parseInterval = () => {
  const configuredHours = Number(process.env.SUPABASE_KEEP_ALIVE_HOURS);

  if (Number.isFinite(configuredHours) && configuredHours > 0) {
    return configuredHours * 60 * 60 * 1000;
  }

  return DEFAULT_INTERVAL_MS;
};

const pingSupabase = async () => {
  if (!supabase) {
    console.warn("Keep-alive do Supabase ignorado: credenciais nao configuradas.");
    return;
  }

  const { error } = await supabase.from("planos").select("id").limit(1);

  if (error) {
    throw error;
  }

  console.log(`Keep-alive do Supabase concluido em ${new Date().toISOString()}.`);
};

const startSupabaseKeepAlive = () => {
  const intervalMs = parseInterval();

  const runPing = () => {
    pingSupabase().catch((error) => {
      console.error("Falha no keep-alive do Supabase:", error.message || error);
    });
  };

  runPing();
  const timer = setInterval(runPing, intervalMs);
  timer.unref();

  console.log(`Keep-alive do Supabase agendado a cada ${intervalMs / 3_600_000} hora(s).`);

  return () => clearInterval(timer);
};

module.exports = { pingSupabase, startSupabaseKeepAlive };
