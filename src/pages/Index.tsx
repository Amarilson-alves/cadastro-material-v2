import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { HardHat, Settings, LogOut, ChevronRight, Lock } from 'lucide-react';

export default function Index() {
  const { perfil, logout } = useAuth();
  
  const isStaff = perfil?.role === 'staff';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-green-600/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative w-full max-w-md mx-4 animate-fade-in z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 mb-5 shadow-2xl backdrop-blur-sm">
            <span className="text-4xl">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Cadastro de Materiais</h1>
          <p className="text-slate-400 text-sm">
            Bem-vindo, <strong className="text-white">{perfil?.nome || 'Usuário'}</strong>. Selecione o módulo:
          </p>
        </div>

        {/* Menu de Acessos */}
        <div className="space-y-4">
          
          <Link to="/campo"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/40 transition-smooth backdrop-blur-sm">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center group-hover:bg-orange-500/25 transition-smooth">
              <HardHat className="h-6 w-6 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-white text-base">Acesso Campo</div>
              <div className="text-slate-400 text-sm">Apontamento de obras e materiais</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-smooth" />
          </Link>

          {isStaff ? (
            <Link to="/interno"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-smooth backdrop-blur-sm">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center group-hover:bg-green-500/25 transition-smooth">
                <Settings className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-white text-base">Acesso Interno</div>
                <div className="text-slate-400 text-sm">Administração e Relatórios</div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-green-400 group-hover:translate-x-1 transition-smooth" />
            </Link>
          ) : (
            <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-black/20 opacity-60 cursor-not-allowed backdrop-blur-sm">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-500 text-base">Acesso Interno</div>
                <div className="text-slate-600 text-sm">Área restrita à administração</div>
              </div>
            </div>
          )}

          <button onClick={logout}
            className="group flex items-center gap-4 p-4 w-full rounded-2xl border border-white/5 hover:bg-white/10 transition-smooth backdrop-blur-sm mt-8">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center">
              <LogOut className="h-5 w-5 text-slate-500 group-hover:text-red-400 transition-smooth" />
            </div>
            <div className="font-semibold text-slate-400 group-hover:text-white transition-smooth text-left">
              Encerrar Sessão
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}