const supabase = require('./supabase');

(async () => {
  if (!supabase) {
    console.error('Supabase client not configured.');
    process.exit(1);
  }

  const email = 'admin@eplano.com';

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,nome,email,perfil')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Erro na query:', error.message || error);
      process.exit(1);
    }

    if (!data) {
      console.log('Usuário não encontrado.');
      process.exit(0);
    }

    console.log('Encontrado:', data);
    process.exit(0);
  } catch (e) {
    console.error('Erro inesperado:', e.message || e);
    process.exit(1);
  }
})();
