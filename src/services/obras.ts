import { supabase } from '@/lib/supabase';
import type { Obra, FiltrosObra, MaterialSelecionado, KpisObras } from '@/types';

type ObraInput = {
  tecnico: string;
  uf: string;
  cidade: string;
  cluster?: string;
  endereco: string;
  numero: string;
  complemento: string;
  tipo_obra: string;
  obs: string;
  obra_id?: string;
  materiais: MaterialSelecionado[];
};

// Técnico salva obra — status sempre 'aguardando' para revisão do admin
export async function salvarObra(input: ObraInput): Promise<string> {
  const { data: obra, error: obraError } = await supabase
    .from('obras')
    .insert({
      obra_id:     input.obra_id || null,
      tecnico:     input.tecnico.trim(),
      uf:          input.uf,
      cidade:      input.cidade.trim(),
      cluster:     input.cluster || null,
      endereco:    input.endereco.trim(),
      numero:      input.numero.trim(),
      complemento: input.complemento.trim() || null,
      tipo_obra:   input.tipo_obra,
      obs:         input.obs.trim() || null,
      status:      'aguardando',
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

// Busca obras com filtros (incluindo status)
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

  // Filtro de status — trata 'aguardando' como incluindo legado 'Nova'
  if (filtros.status && filtros.status !== 'todos') {
    if (filtros.status === 'aguardando') {
      query = query.in('status', ['aguardando', 'Nova']);
    } else {
      query = query.eq('status', filtros.status);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// KPIs: contagem por status (query leve com só o campo status)
export async function getKpisObras(): Promise<KpisObras> {
  const { data, error } = await supabase.from('obras').select('status');
  if (error) throw new Error(error.message);

  const kpis: KpisObras = { aguardando: 0, em_analise: 0, validada: 0, concluida: 0 };
  (data ?? []).forEach(o => {
    const s = o.status as string;
    if (s === 'aguardando' || s === 'Nova') kpis.aguardando++;
    else if (s === 'em_analise') kpis.em_analise++;
    else if (s === 'validada')   kpis.validada++;
    else if (s === 'concluida')  kpis.concluida++;
  });
  return kpis;
}

// Admin edita obra (ID, tipo, obs_admin, quantidades de materiais)
export async function editarObra(
  obraId: string,
  dados: {
    obra_id?: string | null;
    tipo_obra?: string;
    obs_admin?: string;
    status?: string;
    materiaisQtd?: { id: string; quantidade: number }[];
  }
): Promise<void> {
  const updateFields: Record<string, unknown> = {};
  if (dados.obra_id   !== undefined) updateFields.obra_id   = dados.obra_id || null;
  if (dados.tipo_obra !== undefined) updateFields.tipo_obra = dados.tipo_obra;
  if (dados.obs_admin !== undefined) updateFields.obs_admin = dados.obs_admin || null;
  if (dados.status    !== undefined) updateFields.status    = dados.status;

  if (Object.keys(updateFields).length > 0) {
    const { error } = await supabase.from('obras').update(updateFields).eq('id', obraId);
    if (error) throw new Error(error.message);
  }

  if (dados.materiaisQtd && dados.materiaisQtd.length > 0) {
    for (const mat of dados.materiaisQtd) {
      if (mat.quantidade <= 0) {
        const { error } = await supabase.from('materiais_utilizados').delete().eq('id', mat.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('materiais_utilizados')
          .update({ quantidade: mat.quantidade })
          .eq('id', mat.id);
        if (error) throw new Error(error.message);
      }
    }
  }
}

// Admin marca como em análise ao abrir a obra
export async function marcarEmAnalise(obraId: string): Promise<void> {
  await supabase
    .from('obras')
    .update({ status: 'em_analise' })
    .eq('id', obraId)
    .in('status', ['aguardando', 'Nova']); // Só muda se ainda estiver aguardando
}

// Admin valida e conclui a obra
export async function validarObra(obraId: string, validadoPor: string): Promise<void> {
  const { error } = await supabase
    .from('obras')
    .update({
      status:      'concluida',
      validado_por: validadoPor,
      validado_em:  new Date().toISOString(),
    })
    .eq('id', obraId);
  if (error) throw new Error(error.message);
}