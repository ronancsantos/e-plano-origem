const supabase = require('./supabase');
const bcrypt = require('bcryptjs');

(async () => {
  if (!supabase) {
    console.error('Supabase client not configured. Check backend/.env for SUPABASE_URL and SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  const email = 'admin@eplano.com';
  const senha = '123456';

  try {
    const { data: existente, error: errCheck } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (errCheck) {
      console.error('Erro ao verificar usuário existente:', errCheck.message || errCheck);
      process.exit(1);
    }

    if (existente) {
      console.log('Usuário já existe com id:', existente.id);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nome: 'Admin',
          email,
          senha: hashed,
          perfil: 'admin'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir usuário:', error.message || error);
      process.exit(1);
    }

    console.log('Usuário criado com id:', data.id);
    process.exit(0);
  } catch (e) {
    console.error('Erro inesperado:', e.message || e);
    process.exit(1);
  }
})();
