import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Trash2, Edit2, Shield, Loader2, HardHat, Search, Eye, EyeOff, Plus, Users } from 'lucide-react';
import type { Perfil } from '@/types';

const ic = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth';

export default function GerenciarEquipe() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nome: '', matricula: '', funcao: 'tecnico', senha: '' });
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);

  const { data: equipe, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data as Perfil[];
    },
  });

  const mutationCriar = useMutation({
    mutationFn: async (novoUser: typeof form) => {
      const emailFake = `${novoUser.matricula.toUpperCase()}@cadastro.fake`;
      const { data, error } = await supabase.functions.invoke('gerenciar-usuarios', {
        body: {
          acao: 'criar',
          email: emailFake,
          password: novoUser.senha,
          nome: novoUser.nome,
          matricula: novoUser.matricula.toUpperCase(),
          role: novoUser.funcao,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      setForm({ nome: '', matricula: '', funcao: 'tecnico', senha: '' });
      queryClient.invalidateQueries({ queryKey: ['equipe'] });
    },
    onError: (err: any) => toast.error(`Erro ao criar: ${err.message}`),
  });

  const mutationDeletar = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('gerenciar-usuarios', {
        body: { acao: 'deletar', userId: id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Usuário removido!');
      queryClient.invalidateQueries({ queryKey: ['equipe'] });
    },
    onError: (err: any) => toast.error(`Erro ao deletar: ${err.message}`),
  });

  const mutationEditar = useMutation({
    mutationFn: async (dados: { id: string; nome: string; role: string; senha?: string }) => {
      const { data, error } = await supabase.functions.invoke('gerenciar-usuarios', {
        body: {
          acao: 'editar',
          userId: dados.id,
          nome: dados.nome,
          role: dados.role,
          senha: dados.senha,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!');
      setEditando(null);
      queryClient.invalidateQueries({ queryKey: ['equipe'] });
    },
    onError: (err: any) => toast.error(`Erro ao editar: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z]\d{5,8}$/.test(form.matricula)) {
      toast.error('A matrícula deve ter 1 letra e 5 a 8 números.');
      return;
    }
    mutationCriar.mutate(form);
  };

  const usuariosFiltrados = buscaUsuario.trim().length > 0
    ? equipe?.filter(u =>
        u.nome.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
        u.matricula.toLowerCase().includes(buscaUsuario.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Adicionar novo usuário ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-600">Adicionar novo usuário</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            required
            type="text"
            placeholder="Nome completo"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            className={ic}
          />
          <input
            required
            type="text"
            placeholder="Matrícula (Ex: A012345)"
            value={form.matricula}
            onChange={e => setForm({ ...form, matricula: e.target.value.toUpperCase() })}
            className={`${ic} uppercase`}
          />
          <select
            value={form.funcao}
            onChange={e => setForm({ ...form, funcao: e.target.value })}
            className={ic}
          >
            <option value="tecnico">Técnico (Campo)</option>
            <option value="staff">Staff (Admin)</option>
          </select>
          <div className="relative">
            <input
              required
              minLength={6}
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Senha"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              className={ic}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={mutationCriar.isPending}
            className="flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-smooth shadow-sm"
          >
            {mutationCriar.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
              : <><Plus className="h-4 w-4" /> Criar conta</>
            }
          </button>
        </form>
      </div>

      {/* ── Buscar e editar ── */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-4">Buscar e editar</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={buscaUsuario}
            onChange={e => setBuscaUsuario(e.target.value)}
            placeholder="Buscar por nome ou matrícula..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-smooth"
          />
        </div>

        {isLoading && buscaUsuario && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}

        {buscaUsuario.trim().length > 0 && usuariosFiltrados && usuariosFiltrados.length > 0 && (
          <div className="space-y-1.5">
            {/* Cabeçalhos */}
            <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
              <span className="col-span-2">Nome</span>
              <span>Matrícula</span>
              <span>Função</span>
              <span>Status</span>
              <span className="text-right">Ações</span>
            </div>

            {usuariosFiltrados.map(membro => (
              <div key={membro.id}>
                {editando?.id === membro.id ? (
                  <EditarUsuarioForm
                    usuario={editando}
                    onSalvar={dados => mutationEditar.mutate(dados)}
                    onCancelar={() => setEditando(null)}
                    salvando={mutationEditar.isPending}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-smooth text-sm">
                    <span className="col-span-2 font-medium text-gray-800 truncate">{membro.nome}</span>
                    <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg w-fit">
                      {membro.matricula}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      {membro.role === 'staff'
                        ? <Shield className="h-3.5 w-3.5 text-green-500" />
                        : <HardHat className="h-3.5 w-3.5 text-orange-500" />
                      }
                      {membro.role === 'staff' ? 'Staff' : 'Técnico'}
                    </span>
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg w-fit font-medium">
                      Ativo
                    </span>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setEditando(membro)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-400 hover:text-blue-600 transition-smooth"
                        title="Editar usuário"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja remover permanentemente o acesso de ${membro.nome}?`))
                            mutationDeletar.mutate(membro.id);
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-smooth"
                        title="Remover usuário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {buscaUsuario.trim().length > 0 && usuariosFiltrados && usuariosFiltrados.length === 0 && !isLoading && (
          <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
            <Users className="h-9 w-9 opacity-30" />
            <p className="text-sm">Nenhum usuário encontrado para "{buscaUsuario}".</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form de edição inline ──────────────────────────────────────────────────────
function EditarUsuarioForm({ usuario, onSalvar, onCancelar, salvando }: {
  usuario: Perfil;
  onSalvar: (d: { id: string; nome: string; role: string; senha?: string }) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [dados, setDados] = useState({ nome: usuario.nome, role: usuario.role, senha: '' });
  const [mostrarSenhaEdit, setMostrarSenhaEdit] = useState(false);

  return (
    <div className="border border-blue-200 rounded-2xl p-4 bg-blue-50/40 space-y-3 animate-fade-in my-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-600">Editando: {usuario.matricula}</span>
        <span className="text-xs text-gray-400">Matrícula não pode ser alterada</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          value={dados.nome}
          onChange={e => setDados({ ...dados, nome: e.target.value })}
          className={`${ic} sm:col-span-2`}
          placeholder="Nome completo"
        />
        <select
          value={dados.role}
          onChange={e => setDados({ ...dados, role: e.target.value })}
          className={ic}
        >
          <option value="tecnico">Técnico (Campo)</option>
          <option value="staff">Staff (Admin)</option>
        </select>
        <div className="relative">
          <input
            type={mostrarSenhaEdit ? 'text' : 'password'}
            value={dados.senha}
            onChange={e => setDados({ ...dados, senha: e.target.value })}
            className={ic}
            placeholder="Nova senha (opcional)"
          />
          <button
            type="button"
            onClick={() => setMostrarSenhaEdit(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {mostrarSenhaEdit ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSalvar({ id: usuario.id, nome: dados.nome, role: dados.role, senha: dados.senha })}
          disabled={salvando}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-smooth"
        >
          {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button
          onClick={onCancelar}
          className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-white transition-smooth"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
