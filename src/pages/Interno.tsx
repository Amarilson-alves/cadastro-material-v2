import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getObras, getKpisObras, editarObra, marcarEmAnalise, validarObra } from '@/services/obras';
import { adicionarMaterial, removerMaterial, atualizarMaterial } from '@/services/materials';
import { useBuscaMateriais } from '@/hooks/useMateriais';
import { exportarObrasExcel } from '@/utils/exportExcel';
import { useAuth } from '@/hooks/useAuth';
import type { FiltrosObra, Material, Obra, MateriaisUtilizados } from '@/types';
import { formatarData, formatSKU } from '@/lib/utils';
import {
  ArrowLeft, Search, Download, Plus, Trash2, Edit2, Settings,
  Package, FileSpreadsheet, Loader2, X, Users, ChevronDown, ChevronRight,
  CheckCircle, Clock, AlertCircle, Eye,
} from 'lucide-react';
import GerenciarEquipe from '@/components/GerenciarEquipe';

const ic = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth';
const sc = ic;

const FILTROS_VAZIOS: FiltrosObra = {
  endereco: '', tecnico: '', cidade: '', uf: 'todos', tipo_obra: 'todos',
  data_de: '', data_ate: '', status: 'aguardando',
};

type Aba = 'consultar' | 'materiais' | 'equipe';

function StatusBadge({ status }: { status: string }) {
  if (status === 'aguardando' || status === 'Nova')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium"><Clock className="h-3 w-3" />Aguardando</span>;
  if (status === 'em_analise')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium"><Eye className="h-3 w-3" />Em análise</span>;
  if (status === 'validada')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium"><CheckCircle className="h-3 w-3" />Validada</span>;
  if (status === 'concluida')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium"><CheckCircle className="h-3 w-3" />Concluída</span>;
  return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">{status}</span>;
}

export default function Interno() {
  const { perfil } = useAuth();
  const [aba, setAba] = useState<Aba>('consultar');
  const [filtros, setFiltros] = useState<FiltrosObra>(FILTROS_VAZIOS);
  const [buscarAtivado, setBuscarAtivado] = useState(true);
  const [novoMaterial, setNovoMaterial] = useState({
    mat_code: '', sku: '', descricao: '', unidade: '', categoria: 'Interno' as 'Interno' | 'Externo',
  });
  const [buscaGerenciar, setBuscaGerenciar] = useState('');
  const [editandoMaterial, setEditandoMaterial] = useState<Material | null>(null);
  const [obraExpandida, setObraExpandida] = useState<string | null>(null);
  const [obraDrawer, setObraDrawer] = useState<Obra | null>(null);
  const queryClient = useQueryClient();

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ['kpis-obras'],
    queryFn: getKpisObras,
    refetchInterval: 30_000,
  });

  // Obras
  const { data: obras = [], isFetching } = useQuery({
    queryKey: ['obras', filtros],
    queryFn: () => getObras(filtros),
    enabled: buscarAtivado,
  });

  const { data: materiaisEncontrados = [], isLoading: buscando } = useBuscaMateriais(buscaGerenciar);

  const addMutation = useMutation({
    mutationFn: adicionarMaterial,
    onSuccess: () => {
      toast.success('Material cadastrado!');
      setNovoMaterial({ mat_code: '', sku: '', descricao: '', unidade: '', categoria: 'Interno' });
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: removerMaterial,
    onSuccess: () => {
      toast.success('Material removido!');
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['busca-materiais'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ sku, dados }: { sku: string; dados: { mat_code: string; descricao: string; unidade: string; quantidade: number } }) =>
      atualizarMaterial(sku, dados),
    onSuccess: () => {
      toast.success('Material atualizado!');
      setEditandoMaterial(null);
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['busca-materiais'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editarObraMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Parameters<typeof editarObra>[1] }) =>
      editarObra(id, dados),
    onSuccess: () => {
      toast.success('Obra atualizada!');
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-obras'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const validarObraMutation = useMutation({
    mutationFn: (obraId: string) => validarObra(obraId, perfil?.nome ?? 'Admin'),
    onSuccess: () => {
      toast.success('Obra validada e concluída!');
      setObraDrawer(null);
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-obras'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = (key: keyof FiltrosObra, val: string) => setFiltros(p => ({ ...p, [key]: val }));

  const abrirDrawer = async (obra: Obra) => {
    setObraDrawer(obra);
    setObraExpandida(null);
    if (obra.status === 'aguardando' || obra.status === 'Nova') {
      await marcarEmAnalise(obra.id);
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-obras'] });
    }
  };

  const concluida = (o: Obra) => o.status === 'concluida' || o.status === 'validada';

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Header */}
      <header className="bg-[#0f172a] text-white sticky top-0 z-20 shadow-lg border-b-2 border-green-500/60">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Settings className="h-4 w-4 text-green-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Administração</h1>
              <p className="text-green-300/70 text-xs leading-tight">Consulta, exportação e gestão</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <TabBtn active={aba === 'consultar'} onClick={() => setAba('consultar')} icon={<FileSpreadsheet className="h-4 w-4" />}>
            Consultar obras
          </TabBtn>
          <TabBtn active={aba === 'materiais'} onClick={() => setAba('materiais')} icon={<Package className="h-4 w-4" />}>
            Gerenciar materiais
          </TabBtn>
          <TabBtn active={aba === 'equipe'} onClick={() => setAba('equipe')} icon={<Users className="h-4 w-4" />}>
            Gerenciar equipe
          </TabBtn>
        </div>

        {/* ══ ABA: CONSULTAR ══ */}
        {aba === 'consultar' && (
          <div className="animate-fade-in">

            {/* KPIs */}
            {kpis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Aguardando', val: kpis.aguardando, color: 'border-amber-400', text: 'text-amber-700', status: 'aguardando' },
                  { label: 'Em análise',  val: kpis.em_analise, color: 'border-blue-400',  text: 'text-blue-700',  status: 'em_analise' },
                  { label: 'Validadas',   val: kpis.validada,   color: 'border-green-400', text: 'text-green-700', status: 'validada' },
                  { label: 'Concluídas',  val: kpis.concluida,  color: 'border-gray-300',  text: 'text-gray-500',  status: 'concluida' },
                ].map(k => (
                  <button key={k.status}
                    onClick={() => { setFiltros(p => ({ ...p, status: k.status })); setBuscarAtivado(true); queryClient.invalidateQueries({ queryKey: ['obras'] }); }}
                    className={`card p-4 text-left border-t-2 ${k.color} hover:shadow-md transition-smooth cursor-pointer`}>
                    <div className="text-xs text-gray-500 mb-1">{k.label}</div>
                    <div className={`text-2xl font-semibold ${k.text}`}>{k.val}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-4 flex-wrap">
              {/* Layout: tabela + drawer lado a lado */}
              <div className={`flex gap-3 w-full transition-all duration-200`}>

                {/* Painel filtros + tabela */}
                <div className={`${obraDrawer ? 'flex-1 min-w-0' : 'w-full'} space-y-4`}>

                  {/* Filtros */}
                  <div className="card p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { label: 'Aguardando', value: 'aguardando' },
                        { label: 'Em análise',  value: 'em_analise' },
                        { label: 'Validadas',   value: 'validada' },
                        { label: 'Concluídas',  value: 'concluida' },
                        { label: 'Todas',       value: 'todos' },
                      ].map(c => (
                        <button key={c.value}
                          onClick={() => { f('status', c.value); setBuscarAtivado(true); queryClient.invalidateQueries({ queryKey: ['obras'] }); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-smooth ${filtros.status === c.value ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {c.label}
                        </button>
                      ))}
                      <div className="ml-auto flex gap-2">
                        <button onClick={() => exportarObrasExcel(obras)} disabled={obras.length === 0}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-smooth">
                          <Download className="h-3.5 w-3.5" /> Excel
                        </button>
                        <button onClick={() => { setFiltros(FILTROS_VAZIOS); setBuscarAtivado(true); setObraDrawer(null); }}
                          className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-smooth">
                          <X className="h-3.5 w-3.5" /> Limpar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <FilterInput placeholder="Técnico" value={filtros.tecnico} onChange={v => f('tecnico', v)} />
                      <FilterInput placeholder="Cidade"  value={filtros.cidade}  onChange={v => f('cidade', v)} />
                      <FilterInput placeholder="Endereço" value={filtros.endereco} onChange={v => f('endereco', v)} />
                      <select value={filtros.uf} onChange={e => f('uf', e.target.value)} className={sc}>
                        <option value="todos">Todas as UFs</option>
                        {['PR', 'PRI', 'SC', 'RS'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input type="date" value={filtros.data_de}  onChange={e => f('data_de', e.target.value)}  className={`${sc} flex-1`} />
                      <input type="date" value={filtros.data_ate} onChange={e => f('data_ate', e.target.value)} className={`${sc} flex-1`} />
                      <button onClick={() => { setBuscarAtivado(true); queryClient.invalidateQueries({ queryKey: ['obras'] }); }}
                        disabled={isFetching}
                        className="flex items-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-medium px-4 py-2 rounded-xl transition-smooth">
                        {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {isFetching ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  {/* Tabela */}
                  {obras.length > 0 && (
                    <div className="card overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                        {obras.length} {obras.length === 1 ? 'obra encontrada' : 'obras encontradas'} — clique para editar
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Data', 'Técnico', 'Cidade', 'Endereço', 'UF', 'Status', 'Materiais', ''].map(h => (
                                <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-400 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {obras.map((obra, i) => {
                              const isSelected = obraDrawer?.id === obra.id;
                              const qtdMat = obra.materiais_utilizados?.length ?? 0;
                              const expandida = obraExpandida === obra.id;
                              return (
                                <React.Fragment key={obra.id}>
                                  <tr
                                    onClick={() => abrirDrawer(obra)}
                                    className={`border-b border-gray-50 cursor-pointer transition-smooth
                                      ${isSelected ? 'bg-blue-50' : i % 2 === 0 ? '' : 'bg-gray-50/50'}
                                      hover:bg-blue-50/60`}
                                  >
                                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap font-mono">{formatarData(obra.criado_em)}</td>
                                    <td className="px-3 py-2.5 text-sm font-medium text-gray-800">{obra.tecnico}</td>
                                    <td className="px-3 py-2.5 text-sm text-gray-600">{obra.cidade}</td>
                                    <td className="px-3 py-2.5 text-sm text-gray-600">{obra.endereco}, {obra.numero}</td>
                                    <td className="px-3 py-2.5">
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{obra.uf}</span>
                                    </td>
                                    <td className="px-3 py-2.5"><StatusBadge status={obra.status} /></td>
                                    <td className="px-3 py-2.5">
                                      <button onClick={e => { e.stopPropagation(); qtdMat > 0 && setObraExpandida(p => p === obra.id ? null : obra.id); }}
                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition-smooth">
                                        {qtdMat} {qtdMat === 1 ? 'item' : 'itens'}
                                      </button>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-400">
                                      {isSelected ? <ChevronRight className="h-4 w-4 text-blue-500" /> : <ChevronRight className="h-4 w-4" />}
                                    </td>
                                  </tr>
                                  {expandida && obra.materiais_utilizados && obra.materiais_utilizados.length > 0 && (
                                    <tr key={`${obra.id}-expand`} className="bg-slate-50 border-b border-gray-100">
                                      <td colSpan={8} className="px-4 py-2.5">
                                        <div className="flex flex-wrap gap-2">
                                          {obra.materiais_utilizados.map((m, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                                              <span className="font-mono text-gray-400">{m.mat_code || m.sku}</span>
                                              <span className="text-gray-700 font-medium truncate max-w-[160px]">{m.descricao}</span>
                                              <span className="text-slate-400">·</span>
                                              <span className="font-semibold text-slate-700">{m.quantidade} {m.unidade}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {buscarAtivado && !isFetching && obras.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma obra encontrada com esses filtros.</p>
                    </div>
                  )}
                </div>

                {/* Drawer lateral */}
                {obraDrawer && (
                  <DrawerObra
                    obra={obraDrawer}
                    onClose={() => setObraDrawer(null)}
                    onSalvar={(dados) => editarObraMutation.mutate({ id: obraDrawer.id, dados })}
                    onValidar={() => validarObraMutation.mutate(obraDrawer.id)}
                    salvando={editarObraMutation.isPending}
                    validando={validarObraMutation.isPending}
                    concluida={concluida(obraDrawer)}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ ABA: MATERIAIS ══ */}
        {aba === 'materiais' && (
          <div className="space-y-5 animate-fade-in">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-600 mb-5">Adicionar novo material</h2>
              <div className="hidden sm:grid grid-cols-5 gap-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                <span>Mat Code</span><span>SKU</span><span>Descrição</span><span>Unidade</span><span>Categoria</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <input placeholder="MAT-001" value={novoMaterial.mat_code}
                  onChange={e => setNovoMaterial({...novoMaterial, mat_code: e.target.value.toUpperCase()})} className={ic} />
                <input placeholder="0001-0001-1" value={novoMaterial.sku}
                  onChange={e => setNovoMaterial({...novoMaterial, sku: formatSKU(e.target.value)})} maxLength={11} className={ic} />
                <input placeholder="Nome do material" value={novoMaterial.descricao}
                  onChange={e => setNovoMaterial({...novoMaterial, descricao: e.target.value})} className={`${ic} sm:col-span-1`} />
                <select value={novoMaterial.unidade} onChange={e => setNovoMaterial({...novoMaterial, unidade: e.target.value})} className={ic}>
                  <option value="">Unidade</option>
                  {['KG','UN','MT','CX','U','M','UNI','CJ','RL','ROL'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <select value={novoMaterial.categoria} onChange={e => setNovoMaterial({...novoMaterial, categoria: e.target.value as 'Interno'|'Externo'})} className={ic}>
                  <option value="Interno">Interno</option>
                  <option value="Externo">Externo</option>
                </select>
              </div>
              <button onClick={() => {
                if (!novoMaterial.mat_code) return toast.error('Mat Code obrigatório.');
                if (!novoMaterial.sku) return toast.error('SKU obrigatório.');
                if (!novoMaterial.descricao) return toast.error('Descrição obrigatória.');
                if (!novoMaterial.unidade) return toast.error('Unidade obrigatória.');
                addMutation.mutate(novoMaterial);
              }} disabled={addMutation.isPending}
                className="mt-4 flex items-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-smooth shadow-sm">
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {addMutation.isPending ? 'Cadastrando...' : 'Cadastrar material'}
              </button>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-600 mb-4">Buscar e editar</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={buscaGerenciar} onChange={e => setBuscaGerenciar(e.target.value)}
                  placeholder="Buscar por Mat Code, SKU ou descrição..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth" />
              </div>
              {buscando && <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</div>}
              {materiaisEncontrados.length > 0 && (
                <div className="space-y-1.5">
                  <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
                    <span>Mat Code</span><span>SKU</span><span className="col-span-2">Descrição</span><span>Unid / Estq</span><span className="text-right">Ações</span>
                  </div>
                  {materiaisEncontrados.map(mat => (
                    <div key={mat.sku}>
                      {editandoMaterial?.sku === mat.sku ? (
                        <EditarMaterialForm material={editandoMaterial}
                          onSalvar={dados => updateMaterialMutation.mutate({ sku: mat.sku, dados })}
                          onCancelar={() => setEditandoMaterial(null)}
                          salvando={updateMaterialMutation.isPending} />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-smooth text-sm">
                          <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg w-fit font-medium">{mat.mat_code}</span>
                          <span className="font-mono text-[11px] text-gray-400">{mat.sku}</span>
                          <span className="col-span-2 font-medium text-gray-800 truncate">{mat.descricao}</span>
                          <span className="text-xs text-gray-400">{mat.unidade} · <span className="text-gray-600 font-semibold">{mat.quantidade}</span></span>
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setEditandoMaterial(mat)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-smooth">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { if (confirm(`Remover "${mat.descricao}"?`)) deleteMaterialMutation.mutate(mat.sku); }}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-smooth">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {buscaGerenciar && !buscando && materiaisEncontrados.length === 0 && (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
                  <Package className="h-9 w-9 opacity-30" />
                  <p className="text-sm">Nenhum material encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ABA: EQUIPE ══ */}
        {aba === 'equipe' && <GerenciarEquipe />}

      </main>
    </div>
  );
}

// ── Drawer de edição da obra ──────────────────────────────────────────────────
function DrawerObra({ obra, onClose, onSalvar, onValidar, salvando, validando, concluida }: {
  obra: Obra;
  onClose: () => void;
  onSalvar: (d: Parameters<typeof editarObra>[1]) => void;
  onValidar: () => void;
  salvando: boolean;
  validando: boolean;
  concluida: boolean;
}) {
  const [obraId, setObraId]     = useState(obra.obra_id ?? '');
  const [tipoObra, setTipoObra] = useState(obra.tipo_obra);
  const [obsAdmin, setObsAdmin] = useState(obra.obs_admin ?? '');
  const [matsQtd, setMatsQtd]   = useState<Record<string, number>>(
    Object.fromEntries((obra.materiais_utilizados ?? []).map(m => [m.id, m.quantidade]))
  );

  const semId = !obraId.trim();

  const handleSalvar = () => {
    const materiaisQtd = (obra.materiais_utilizados ?? []).map(m => ({
      id: m.id,
      quantidade: matsQtd[m.id] ?? m.quantidade,
    }));
    onSalvar({ obra_id: obraId.trim() || null, tipo_obra: tipoObra, obs_admin: obsAdmin, materiaisQtd });
  };

  return (
    <div className="w-80 flex-shrink-0 card flex flex-col animate-slide-from-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 truncate">{obra.endereco}, {obra.numero}</div>
          <div className="text-xs text-gray-400">{obra.tecnico} · {formatarData(obra.criado_em)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={obra.status} />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-smooth">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Aviso se sem ID */}
        {semId && !concluida && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            ID não informado pelo técnico
          </div>
        )}

        {/* Identificação */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">ID da obra</label>
          <input value={obraId} onChange={e => setObraId(e.target.value)}
            disabled={concluida}
            placeholder="Digite o ID oficial..."
            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth ${semId && !concluida ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'} ${concluida ? 'bg-gray-50 text-gray-400' : ''}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de obra</label>
          <select value={tipoObra} onChange={e => setTipoObra(e.target.value)} disabled={concluida} className={`${sc} w-full`}>
            <option value="Alivio">Alívio</option>
            <option value="Adequacao">Adequação</option>
          </select>
        </div>

        {/* Dados originais */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Dados do técnico</div>
          {[
            ['Cidade', `${obra.cidade} · ${obra.uf}`],
            ['Endereço', `${obra.endereco}, ${obra.numero}`],
            ['Cluster', obra.cluster ?? '—'],
            ['Obs', obra.obs ?? '—'],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-2">
              <span className="text-xs text-gray-400 w-16 flex-shrink-0">{label}</span>
              <span className="text-xs text-gray-700 flex-1">{val}</span>
            </div>
          ))}
        </div>

        {/* Materiais */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">
            Materiais — {obra.materiais_utilizados?.length ?? 0} itens
          </div>
          <div className="space-y-1.5">
            {(obra.materiais_utilizados ?? []).map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{m.descricao}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{m.mat_code} · {m.unidade}</div>
                </div>
                {concluida ? (
                  <span className="text-xs font-semibold text-gray-600">{m.quantidade}</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setMatsQtd(p => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? m.quantidade) - 1) }))}
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-xs hover:bg-gray-100 transition-smooth">−</button>
                    <span className="text-xs font-semibold w-6 text-center">{matsQtd[m.id] ?? m.quantidade}</span>
                    <button onClick={() => setMatsQtd(p => ({ ...p, [m.id]: (p[m.id] ?? m.quantidade) + 1 }))}
                      className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-xs hover:bg-gray-100 transition-smooth">+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Obs admin */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas internas (admin)</label>
          <textarea value={obsAdmin} onChange={e => setObsAdmin(e.target.value)} disabled={concluida}
            placeholder="Observações internas sobre a obra..." rows={2}
            className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth resize-none ${concluida ? 'bg-gray-50 text-gray-400' : ''}`} />
        </div>

        {/* Dados de conclusão */}
        {concluida && obra.validado_por && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
            <div className="font-medium mb-0.5">Validada por {obra.validado_por}</div>
            <div className="text-green-600">{obra.validado_em ? formatarData(obra.validado_em) : ''}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!concluida && (
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={onValidar} disabled={validando || semId}
            title={semId ? 'Preencha o ID antes de validar' : ''}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-smooth">
            {validando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {validando ? 'Validando...' : 'Validar e concluir'}
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-smooth disabled:opacity-50">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-smooth -mb-px ${
        active ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
      }`}>
      {icon}{children}
    </button>
  );
}

function FilterInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth" />
  );
}

function EditarMaterialForm({ material, onSalvar, onCancelar, salvando }: {
  material: Material;
  onSalvar: (d: { mat_code: string; descricao: string; unidade: string; quantidade: number }) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [dados, setDados] = useState({ mat_code: material.mat_code, descricao: material.descricao, unidade: material.unidade, quantidade: material.quantidade });
  return (
    <div className="border border-blue-200 rounded-2xl p-4 bg-blue-50/40 space-y-3 animate-fade-in">
      <div className="text-xs font-medium text-blue-600">Editando SKU: {material.sku}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input value={dados.mat_code} onChange={e => setDados({...dados, mat_code: e.target.value.toUpperCase()})} className={ic} placeholder="Mat Code" />
        <input value={dados.descricao} onChange={e => setDados({...dados, descricao: e.target.value})} className={`${ic} sm:col-span-1`} placeholder="Descrição" />
        <select value={dados.unidade} onChange={e => setDados({...dados, unidade: e.target.value})} className={ic}>
          {['KG','UN','MT','CX','U','M','UNI','CJ','RL','ROL'].map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <input type="number" min={0} value={dados.quantidade} onChange={e => setDados({...dados, quantidade: Number(e.target.value)})} className={ic} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSalvar(dados)} disabled={salvando}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-smooth">
          {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onCancelar} className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-white transition-smooth">
          Cancelar
        </button>
      </div>
    </div>
  );
}