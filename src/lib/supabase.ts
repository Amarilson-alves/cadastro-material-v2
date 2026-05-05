// =============================================
// CLIENTE SUPABASE — Conexão com o banco de dados
// =============================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente não configuradas. Copie .env.example para .env e preencha os valores.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // A MÁGICA ESTÁ AQUI: Muda o nome do cofre. Se houver uma sessão 
    // fantasma corrompida no navegador, ela será completamente ignorada.
    storageKey: 'app-obras-v3-auth-token',
  }
});