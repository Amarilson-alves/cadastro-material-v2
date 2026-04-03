import { supabase } from '@/lib/supabase';
import type { Obra, FiltrosObra, MaterialSelecionado } from '@/types';

type ObraInput = {
  tecnico: string;
  uf: string;
  cidade: string;
  cluster?: string;     // capturado automaticamente da tabela cidades
  endereco: string;
  numero: string;
  complemento: string;
  tipo_obra: string;
  obs: string;
  obra_id?: string;
  materiais: MaterialSelecionado[];
};

export async function salvarObra(input: ObraInput): Promise<string> {
  const { data: obra, error: obraError } = await supabase
    .from('obras')
    .insert({
      obra_id:     input.obra_id || null,
      tecnico:     input.tecnico.trim(),
      uf:          input.uf,
      cidade:      input.cidade.trim(),
      cluster:     input.cluster || null,   // salvo automaticamente
      endereco:    input.endereco.trim(),
      numero:      input.numero.trim(),
      complemento: input.complemento.trim() || null,
      tipo_obra:   input.tipo_obra,
      obs:         input.obs.trim() || null,
      status:      'Nova',
    })
    .select('id')
    .single();

  if (obraError) throw new Error(obraError.message);

  if (input.materiais.length > 0) {
    const rows = input.materiais.map((m) => ({
      obra_id:    obra.id,
      mat_code:   m.mat_code,
      sku:        m.sku,
      descricao:  m.descricao,
      unidade:    m.unidade,
      quantidade: m.quantidadeSelecionada,
    }));
    const { error } = await supabase.from('materiais_utilizados').insert(rows);
    if (error) throw new Error(error.message);
  }

  return obra.id;
}

export async function getObras(filtros: Partial<FiltrosObra>): Promise<Obra[]> {
  let query = supabase
    .from('obras')
    .select(`*, materiais_utilizados(*)`)
    .order('criado_em', { ascending: false });

  if (filtros.tecnico)  query = query.ilike('tecnico',  `%${filtros.tecnico}%`);
  if (filtros.endereco) query = query.ilike('endereco', `%${filtros.endereco}%`);
  if (filtros.cidade)   query = query.ilike('cidade',   `%${filtros.cidade}%`);
  if (filtros.uf && filtros.uf !== 'todos')
    query = query.eq('uf', filtros.uf);
  if (filtros.tipo_obra && filtros.tipo_obra !== 'todos')
    query = query.eq('tipo_obra', filtros.tipo_obra);
  if (filtros.data_de)  query = query.gte('criado_em', filtros.data_de);
  if (filtros.data_ate) query = query.lte('criado_em', filtros.data_ate + 'T23:59:59');

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
