import { supabase } from '@/lib/supabase';

export type Cidade = {
  id: string;
  codigo: string;
  nome: string;
  regiao: string;
  cluster: string;
};

export async function buscarCidades(termo: string): Promise<Cidade[]> {
  if (!termo.trim()) return [];
  const { data, error } = await supabase
    .from('lista_cidades')   // nome correto da tabela
    .select('id, codigo, nome, regiao, cluster')
    .ilike('nome', `${termo}%`)
    .order('nome')
    .limit(10);
  if (error) throw new Error(error.message);
  return data ?? [];
}
