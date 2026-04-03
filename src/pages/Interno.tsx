import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getObras } from '@/services/obras';
import { adicionarMaterial, removerMaterial, atualizarMaterial } from '@/services/materials';
import { useBuscaMateriais } from '@/hooks/useMateriais';
import { exportarObrasExcel } from '@/utils/exportExcel';
import type { FiltrosObra, Material } from '@/types';
import { formatarData, formatSKU } from '@/lib/utils';
import { ArrowLeft, Search, Download, Plus, Trash2, Edit2, Settings, Package, FileSpreadsheet, Loader2, X } from 'lucide-react';

const FILTROS_VAZIOS: FiltrosObra = {
  endereco: '', tecnico: '', cidade: '', uf: 'todos', tipo_obra: 'todos', data_de: '', data_ate: '',
};
type Aba = 'consultar' | 'materiais';

export default function Interno() {
  const [aba, setAba] = useState<Aba>('consultar');
  const [filtros, setFiltros] = useState<FiltrosObra>(FILTROS_VAZIOS);
  const [buscarAtivado, setBuscarAtivado] = useState(false);
  const [novoMaterial, setNovoMaterial] = useState({ mat_code: '', sku: '', descricao: '', unidade: '', categoria: 'Interno' as 'Interno' | 'Externo' });
  const [buscaGerenciar, setBuscaGerenciar] = useState('');
  const [editando, setEditando] = useState<Material | null>(null);
  const queryClient = useQueryClient();

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

  const deleteMutation = useMutation({
    mutationFn: removerMaterial,
    onSuccess: () => {
      toast.success('Material removido!');
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['busca-materiais'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ sku, dados }: { sku: string; dados: { mat_code: string; descricao: string; unidade: string; quantidade: number } }) =>
      atualizarMaterial(sku, dados),
    onSuccess: () => {
      toast.success('Material atualizado!');
      setEditando(null);
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      queryClient.invalidateQueries({ queryKey: ['busca-materiais'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = (key: keyof FiltrosObra, val: string) => setFiltros(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <header className="bg-[#14532d] text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-smooth">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Settings className="h-4 w-4 text-green-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Administração</h1>
              <p className="text-green-300 text-xs leading-tight">Consulta, exportação e gestão</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Abas */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1 mb-6 shadow-sm">
          <TabBtn active={aba === 'consultar'} onClick={() => setAba('consultar')} icon={<FileSpreadsheet className="h-4 w-4" />}>
            Consultar Obras
          </TabBtn>
          <TabBtn active={aba === 'materiais'} onClick={() => setAba('materiais')} icon={<Package className="h-4 w-4" />}>
            Gerenciar Materiais
          </TabBtn>
        </div>

        {/* ABA: CONSULTAR */}
        {aba === 'consultar' && (
          <div className="space-y-5 animate-fade-in">
            <div className="card p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Filtros de Busca</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <FilterInput placeholder="Técnico" value={filtros.tecnico} onChange={v => f('tecnico', v)} />
                <FilterInput placeholder="Cidade" value={filtros.cidade} onChange={v => f('cidade', v)} />
                <FilterInput placeholder="Endereço" value={filtros.endereco} onChange={v => f('endereco', v)} />
                <select value={filtros.uf} onChange={e => f('uf', e.target.value)} className={sc}>
                  <option value="todos">Todas as UFs</option>
                  {['PR','PRI','SC','RS'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <select value={filtros.tipo_obra} onChange={e => f('tipo_obra', e.target.value)} className={sc}>
                  <option value="todos">Todos os tipos</option>
                  <option value="Alivio">Alívio</option>
                  <option value="Adequacao">Adequação</option>
                </select>
                <div className="flex gap-2">
                  <input type="date" value={filtros.data_de} onChange={e => f('data_de', e.target.value)} className={sc} />
                  <input type="date" value={filtros.data_ate} onChange={e => f('data_ate', e.target.value)} className={sc} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
                <button
                  onClick={() => { setBuscarAtivado(true); queryClient.invalidateQueries({ queryKey: ['obras'] }); }}
                  disabled={isFetching}
                  className="flex items-center gap-2 bg-[#14532d] hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-smooth shadow-sm">
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isFetching ? 'Buscando...' : 'Buscar Obras'}
                </button>
                <button onClick={() => exportarObrasExcel(obras)} disabled={obras.length === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-smooth shadow-sm">
                  <Download className="h-4 w-4" /> Exportar Excel
                </button>
                <button onClick={() => { setFiltros(FILTROS_VAZIOS); setBuscarAtivado(false); }}
                  className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold px-5 py-2.5 rounded-xl transition-smooth">
                  <X className="h-4 w-4" /> Limpar
                </button>
              </div>
            </div>

            {obras.length > 0 && (
              <div className="card overflow-hidden animate-slide-up">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">{obras.length} obras encontradas</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Data','Técnico','Cidade','Endereço','UF','Tipo','Materiais'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {obras.map((obra, i) => (
                        <tr key={obra.id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-smooth ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap font-mono text-xs">{formatarData(obra.criado_em)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{obra.tecnico}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{obra.cidade}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{obra.endereco}, {obra.numero}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{obra.uf}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{obra.tipo_obra}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              {obra.materiais_utilizados?.length ?? 0} itens
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {buscarAtivado && !isFetching && obras.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhuma obra encontrada com esses filtros.</p>
              </div>
            )}
          </div>
        )}

        {/* ABA: MATERIAIS */}
        {aba === 'materiais' && (
          <div className="space-y-5 animate-fade-in">
            {/* Adicionar */}
            <div className="card p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar Novo Material
              </h2>
              {/* Cabeçalho visual igual à planilha */}
              <div className="hidden sm:grid grid-cols-5 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                <span>Mat Code</span><span>SKU</span><span>Descrição do Material</span><span>Unidade</span><span>Categoria</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <input placeholder="MAT-001" value={novoMaterial.mat_code}
                  onChange={e => setNovoMaterial({...novoMaterial, mat_code: e.target.value.toUpperCase()})}
                  className={ic} />
                <input placeholder="0001-0001-1" value={novoMaterial.sku}
                  onChange={e => setNovoMaterial({...novoMaterial, sku: formatSKU(e.target.value)})}
                  maxLength={11} className={ic} />
                <input placeholder="Nome do material" value={novoMaterial.descricao}
                  onChange={e => setNovoMaterial({...novoMaterial, descricao: e.target.value})}
                  className={`${ic} sm:col-span-1`} />
                <select value={novoMaterial.unidade}
                  onChange={e => setNovoMaterial({...novoMaterial, unidade: e.target.value})} className={ic}>
                  <option value="">Unidade</option>
                  {['KG','UN','MT','CX','U','M','UNI','CJ','RL','ROL'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <select value={novoMaterial.categoria}
                  onChange={e => setNovoMaterial({...novoMaterial, categoria: e.target.value as 'Interno'|'Externo'})} className={ic}>
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
                className="mt-4 flex items-center gap-2 bg-[#14532d] hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-smooth shadow-sm">
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {addMutation.isPending ? 'Cadastrando...' : 'Cadastrar Material'}
              </button>
            </div>

            {/* Buscar e editar */}
            <div className="card p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Buscar e Editar</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={buscaGerenciar} onChange={e => setBuscaGerenciar(e.target.value)}
                  placeholder="Buscar por Mat Code, SKU ou descrição..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-smooth" />
              </div>

              {buscando && (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                </div>
              )}

              {materiaisEncontrados.length > 0 && (
                <div className="space-y-1.5">
                  <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">
                    <span>Mat Code</span><span>SKU</span><span className="col-span-2">Descrição</span><span>Unid/Estq</span><span className="text-right">Ações</span>
                  </div>
                  {materiaisEncontrados.map(mat => (
                    <div key={mat.sku}>
                      {editando?.sku === mat.sku
                        ? <EditarForm material={editando}
                            onSalvar={dados => updateMutation.mutate({ sku: mat.sku, dados })}
                            onCancelar={() => setEditando(null)}
                            salvando={updateMutation.isPending} />
                        : (
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-smooth text-sm group">
                            <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg w-fit font-medium">{mat.mat_code}</span>
                            <span className="font-mono text-[11px] text-gray-400">{mat.sku}</span>
                            <span className="col-span-2 font-semibold text-gray-800 truncate">{mat.descricao}</span>
                            <span className="text-xs text-gray-400">{mat.unidade} · <span className="text-gray-600 font-semibold">{mat.quantidade}</span></span>
                            <div className="flex gap-1.5 justify-end">
                              <button onClick={() => setEditando(mat)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-smooth" title="Editar">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => { if (confirm(`Remover "${mat.descricao}"?`)) deleteMutation.mutate(mat.sku); }}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-smooth" title="Remover">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      }
                    </div>
                  ))}
                </div>
              )}

              {buscaGerenciar && !buscando && materiaisEncontrados.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum material encontrado.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }: {
  active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${
        active
          ? 'bg-[#1e3a5f] text-white shadow-sm'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}>
      {icon}{children}
    </button>
  );
}

function FilterInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-smooth" />
  );
}

function EditarForm({ material, onSalvar, onCancelar, salvando }: {
  material: Material;
  onSalvar: (d: { mat_code: string; descricao: string; unidade: string; quantidade: number }) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [dados, setDados] = useState({
    mat_code: material.mat_code, descricao: material.descricao,
    unidade: material.unidade, quantidade: material.quantidade,
  });
  return (
    <div className="border-2 border-blue-200 rounded-2xl p-4 bg-blue-50/50 space-y-3 animate-fade-in">
      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">Editando SKU: {material.sku}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input value={dados.mat_code} onChange={e => setDados({...dados, mat_code: e.target.value.toUpperCase()})} className={ic} placeholder="Mat Code" />
        <input value={dados.descricao} onChange={e => setDados({...dados, descricao: e.target.value})} className={`${ic} sm:col-span-1`} placeholder="Descrição" />
        <select value={dados.unidade} onChange={e => setDados({...dados, unidade: e.target.value})} className={ic}>
          {['KG','UN','MT','CX','U','M','UNI','CJ','RL','ROL'].map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <input type="number" min={0} value={dados.quantidade} onChange={e => setDados({...dados, quantidade: Number(e.target.value)})} className={ic} placeholder="Qtd" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSalvar(dados)} disabled={salvando}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-smooth">
          {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onCancelar} className="border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white transition-smooth">
          Cancelar
        </button>
      </div>
    </div>
  );
}

const ic = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-smooth';
const sc = ic;
