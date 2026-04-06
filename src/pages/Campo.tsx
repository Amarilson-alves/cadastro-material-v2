import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { salvarObra } from '@/services/obras';
import { CidadeInput } from '@/components/CidadeInput';
import type { Material, MaterialSelecionado } from '@/types';
import {
  ArrowLeft, Save, Trash2, Plus, Minus, Search, Package,
  CheckCircle2, HardHat, Loader2, Calendar, RefreshCw,
  ClipboardList, AlertCircle, ListChecks,
} from 'lucide-react';

const UFS = ['PR', 'PRI', 'SC', 'RS'];
const TIPOS_OBRA = [
  { value: 'Alivio',    label: 'Alívio' },
  { value: 'Adequacao', label: 'Adequação' },
];
const FORM_VAZIO = {
  idObra: '', cidade: '', cluster: '',
  endereco: '', numero: '', complemento: '', uf: '', tipoObra: '', obs: '',
};

export default function Campo() {
  const { perfil } = useAuth();
  const [form, setForm] = useState(FORM_VAZIO);
  const [materiais, setMateriais] = useState<MaterialSelecionado[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'Interno' | 'Externo'>('todos');

  const dataHoje = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  const { data: materiaisEncontrados = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['materiais_campo_inteligente', busca, filtroCategoria],
    queryFn: async () => {
      let q = supabase.from('materiais').select('*');
      if (filtroCategoria !== 'todos') q = q.eq('categoria', filtroCategoria);
      if (busca.trim()) {
        const termo = `%${busca.trim()}%`;
        q = q.or(`descricao.ilike.${termo},sku.ilike.${termo},mat_code.ilike.${termo}`);
      }
      const { data, error } = await q.order('descricao').limit(150);
      if (error) throw new Error(error.message);
      return data as Material[];
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const salvarMutation = useMutation({
    mutationFn: salvarObra,
    onSuccess: () => {
      toast.success('Obra salva com sucesso!');
      setForm(FORM_VAZIO);
      setMateriais([]);
      setBusca('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const adicionarMaterial = (material: Material) => {
    setMateriais(prev => {
      const existe = prev.find(m => m.sku === material.sku);
      if (existe) return prev.map(m => m.sku === material.sku ? { ...m, quantidadeSelecionada: m.quantidadeSelecionada + 1 } : m);
      return [...prev, { ...material, quantidadeSelecionada: 1 }];
    });
    toast.success(`${material.descricao} adicionado`);
  };

  const atualizarQuantidade = (sku: string, qtd: number) => {
    if (qtd <= 0) setMateriais(prev => prev.filter(m => m.sku !== sku));
    else setMateriais(prev => prev.map(m => m.sku === sku ? { ...m, quantidadeSelecionada: qtd } : m));
  };

  const handleSalvar = () => {
    const nomeTecnico = perfil?.nome || 'Técnico Desconhecido';
    if (!form.cidade.trim())    return toast.error('Cidade é obrigatória.');
    if (!form.endereco.trim())  return toast.error('Endereço é obrigatório.');
    if (!form.numero.trim())    return toast.error('Número é obrigatório.');
    if (!form.uf)               return toast.error('UF é obrigatória.');
    if (!form.tipoObra)         return toast.error('Tipo de obra é obrigatório.');
    if (materiais.length === 0) return toast.error('Selecione pelo menos um material.');

    let idFinalDaObra = form.idObra.trim();
    if (!idFinalDaObra) {
      const numerosAleatorios = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      idFinalDaObra = `ID - ${numerosAleatorios}`;
    }

    salvarMutation.mutate({
      tecnico: nomeTecnico,
      uf: form.uf,
      cidade: form.cidade,
      cluster: form.cluster || undefined,
      endereco: form.endereco,
      numero: form.numero,
      complemento: form.complemento,
      tipo_obra: form.tipoObra,
      obs: form.obs,
      obra_id: idFinalDaObra,
      materiais,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Header ── */}
      <header className="bg-[#0f172a] text-white sticky top-0 z-20 shadow-lg border-b-2 border-orange-500/60">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <HardHat className="h-4 w-4 text-orange-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Campo — Técnicos</h1>
              <p className="text-orange-300/70 text-xs leading-tight">Registro de obras e materiais</p>
            </div>
          </div>
          {materiais.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-orange-500/20 text-orange-300 text-xs font-semibold px-2.5 py-1 rounded-full">
              <Package className="h-3 w-3" />
              {materiais.length} {materiais.length === 1 ? 'item' : 'itens'}
            </div>
          )}
        </div>
      </header>

      {/* ── Conteúdo — padding-bottom extra para não ficar atrás da sticky bar ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-28">

        {/* Dados da obra */}
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600">Dados da obra</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Técnico responsável">
              <input
                value={perfil?.nome || 'Carregando...'}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-semibold cursor-not-allowed focus:outline-none"
              />
            </Field>

            <Field label="Data do registro">
              <div className="relative">
                <input
                  value={dataHoje}
                  readOnly
                  className="w-full px-3.5 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-semibold cursor-not-allowed focus:outline-none"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </Field>

            <Field label="ID da obra (opcional)">
              <input value={form.idObra} onChange={e => setForm({...form, idObra: e.target.value})}
                placeholder="Ex: 84920194" className={ic} />
            </Field>

            <Field label="Tipo de obra" required>
              <select value={form.tipoObra} onChange={e => setForm({...form, tipoObra: e.target.value})} className={ic}>
                <option value="">Selecione...</option>
                {TIPOS_OBRA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            <Field label="Endereço" required className="sm:col-span-2">
              <input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})}
                placeholder="Rua das Flores" className={ic} />
            </Field>

            <Field label="Cidade" required>
              <CidadeInput
                value={form.cidade}
                onChange={(nome, cluster) => setForm({...form, cidade: nome, cluster: cluster ?? form.cluster})}
                placeholder="Ex: Curitiba"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Número" required>
                <input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})}
                  placeholder="123" className={ic} />
              </Field>
              <Field label="UF" required>
                <select value={form.uf} onChange={e => e && setForm({...form, uf: e.target.value})} className={ic}>
                  <option value="">UF</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Complemento" className="sm:col-span-2">
              <input value={form.complemento} onChange={e => setForm({...form, complemento: e.target.value})}
                placeholder="Apt 101, Fundos..." className={ic} />
            </Field>

            <Field label="Observações" className="sm:col-span-2">
              <textarea value={form.obs} onChange={e => setForm({...form, obs: e.target.value})}
                placeholder="Observações sobre a obra..." rows={2} className={`${ic} resize-none`} />
            </Field>
          </div>
        </div>

        {/* Seleção de materiais */}
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-600">Selecionar materiais</h2>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
              title="Atualizar lista do banco"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

          {/* Filtros de categoria + busca */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {(['todos', 'Interno', 'Externo'] as const).map(cat => (
                <button key={cat} onClick={() => setFiltroCategoria(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-smooth ${
                    filtroCategoria === cat
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {cat === 'todos' ? 'Todos' : cat}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome, SKU ou código..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth"
              />
            </div>
          </div>

          {/* Estado de erro */}
          {isError && (
            <div className="flex flex-col items-center py-12 text-red-400 gap-2">
              <AlertCircle className="h-9 w-9 opacity-50" />
              <p className="text-sm">Erro ao carregar materiais. Tente atualizar.</p>
            </div>
          )}

          {/* Carregando */}
          {isLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
              <Loader2 className="h-5 w-5 animate-spin" /> Conectando ao banco...
            </div>
          )}

          {/* Grid de materiais */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {materiaisEncontrados.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center py-12 text-gray-400 gap-2">
                  <Package className="h-9 w-9 opacity-30" />
                  <p className="text-sm">Nenhum material encontrado{busca ? ` para "${busca}"` : ''}.</p>
                </div>
              ) : (
                materiaisEncontrados.map(material => {
                  const sel = materiais.some(m => m.sku === material.sku);
                  return (
                    <button
                      key={material.sku}
                      onClick={() => adicionarMaterial(material)}
                      className={`group text-left p-3.5 rounded-xl border transition-smooth relative overflow-hidden ${
                        sel
                          ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400/30'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      {sel && (
                        <CheckCircle2 className="absolute top-2.5 right-2.5 h-4 w-4 text-blue-500" />
                      )}
                      <p className="font-medium text-sm text-gray-800 pr-6 leading-tight truncate">
                        {material.descricao}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                          {material.mat_code || 'S/N'}
                        </span>
                        <span className="text-[10px] text-gray-400">{material.sku || 'S/N'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[10px] text-gray-400">{material.unidade}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Materiais selecionados */}
        {materiais.length > 0 && (
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-600">
                Selecionados
                <span className="ml-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {materiais.length}
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {materiais.map(m => (
                <div key={m.sku}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.descricao}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{m.mat_code} · {m.sku}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => atualizarQuantidade(m.sku, m.quantidadeSelecionada - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-smooth">
                      <Minus className="h-3 w-3 text-gray-600" />
                    </button>
                    <input
                      type="number" min={1} value={m.quantidadeSelecionada}
                      onChange={e => atualizarQuantidade(m.sku, Number(e.target.value))}
                      className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button onClick={() => atualizarQuantidade(m.sku, m.quantidadeSelecionada + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-smooth">
                      <Plus className="h-3 w-3 text-gray-600" />
                    </button>
                    <button onClick={() => atualizarQuantidade(m.sku, 0)}
                      className="w-7 h-7 rounded-lg bg-white border border-red-100 flex items-center justify-center hover:bg-red-50 ml-1 transition-smooth">
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky Save Bar — sempre visível no rodapé ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={handleSalvar}
            disabled={salvarMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-smooth text-sm"
          >
            {salvarMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              : <><Save className="h-4 w-4" /> Salvar obra</>
            }
          </button>
          <button
            onClick={() => { if (window.confirm('Limpar o formulário e todos os materiais selecionados?')) { setForm(FORM_VAZIO); setMateriais([]); setBusca(''); } }}
            className="px-5 border border-gray-200 text-gray-500 hover:bg-gray-100 font-medium rounded-2xl transition-smooth text-sm"
          >
            Limpar
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Componente de campo de formulário ──────────────────────────────────────────
function Field({ label, children, required, className = '' }: {
  label: string; children: React.ReactNode; required?: boolean; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-medium text-gray-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const ic = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth';
