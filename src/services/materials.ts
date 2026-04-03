// =============================================
// SERVIÇO DE MATERIAIS
// =============================================
import { supabase } from '@/lib/supabase';
import type { Material } from '@/types';

export async function getMateriais(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('descricao');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buscarMateriais(query: string): Promise<Material[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .or(`descricao.ilike.%${query}%,sku.ilike.%${query}%,mat_code.ilike.%${query}%`)
    .order('descricao')
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adicionarMaterial(
  material: Omit<Material, 'quantidade'> & { quantidade?: number }
): Promise<void> {
  const { error } = await supabase.from('materiais').insert({
    mat_code: material.mat_code.trim().toUpperCase(),
    sku:      material.sku.trim().toUpperCase(),
    descricao: material.descricao.trim(),
    unidade:  material.unidade,
    quantidade: material.quantidade ?? 0,
    categoria: material.categoria,
  });
  if (error) {
    if (error.code === '23505') throw new Error('Já existe um material com este SKU.');
    throw new Error(error.message);
  }
}

export async function atualizarMaterial(
  sku: string,
  dados: { mat_code: string; descricao: string; unidade: string; quantidade: number }
): Promise<void> {
  const { error } = await supabase
    .from('materiais')
    .update({
      mat_code:  dados.mat_code.trim().toUpperCase(),
      descricao: dados.descricao.trim(),
      unidade:   dados.unidade,
      quantidade: dados.quantidade,
      atualizado_em: new Date().toISOString(),
    })
    .eq('sku', sku);
  if (error) throw new Error(error.message);
}

export async function incrementarMaterial(sku: string, delta: number): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('materiais')
    .select('quantidade')
    .eq('sku', sku)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const novaQuantidade = (data?.quantidade ?? 0) + delta;
  if (novaQuantidade < 0) throw new Error('Quantidade não pode ficar negativa.');

  const { error } = await supabase
    .from('materiais')
    .update({ quantidade: novaQuantidade, atualizado_em: new Date().toISOString() })
    .eq('sku', sku);
  if (error) throw new Error(error.message);
}

export async function removerMaterial(sku: string): Promise<void> {
  const { error } = await supabase.from('materiais').delete().eq('sku', sku);
  if (error) throw new Error(error.message);
}
