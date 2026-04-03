// =============================================
// CLIENTE SUPABASE — Conexão com o banco de dados
// =============================================
import { createClient } from '@supabase/supabase-js';

// Lê as variáveis do arquivo .env (NUNCA coloque os valores aqui diretamente!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente não configuradas. Copie .env.example para .env e preencha os valores.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
