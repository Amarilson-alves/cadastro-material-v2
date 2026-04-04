import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// ─── Ícone de Torre de Telecomunicações ──────────────────────────────────────
function TowerIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 27 A22 22 0 0 1 50 27" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" opacity="0.2"/>
      <path d="M11 23 A17 17 0 0 1 45 23" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M16 19 A12 12 0 0 1 40 19" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M21 15.5 A7 7 0 0 1 35 15.5" stroke="#60a5fa" strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="28" cy="13" r="3.5" fill="#f97316"/>
      <line x1="28" y1="16.5" x2="28" y2="44" stroke="#f97316" strokeWidth="3" strokeLinecap="round"/>
      <line x1="20" y1="27" x2="36" y2="27" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="16" y1="34" x2="40" y2="34" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="28" y1="44" x2="19" y2="52" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="28" y1="44" x2="37" y2="52" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

function RadarPulse() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-blue-500/10"
          style={{
            width: `${(i + 1) * 220}px`,
            height: `${(i + 1) * 220}px`,
            animation: `radar-pulse 4s ease-out ${i * 1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { user, carregando, login } = useAuth();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!carregando && user) return <Navigate to="/" replace />;

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^[A-Za-z]\d{5,8}$/;
    if (!regex.test(matricula)) {
      toast.error('Formato inválido. Use 1 letra e 5 a 8 números. Ex: A012345');
      return;
    }
    setEnviando(true);
    try {
      await login(matricula, senha);
      toast.success('Bem-vindo ao sistema!');
    } catch {
      toast.error('Matrícula ou senha incorretos.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center relative overflow-hidden">

      {/* Gradientes de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-orange-600/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-blue-800/10 blur-3xl" />
      </div>

      {/* Radar animado */}
      <RadarPulse />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-in">

        {/* Identidade / cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 mb-6 shadow-2xl backdrop-blur-sm relative">
            <div className="absolute inset-0 rounded-3xl bg-blue-500/5" />
            <TowerIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            Gestão de Materiais
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="h-px w-8 bg-orange-500/50" />
            <p className="text-orange-400 text-xs font-semibold tracking-widest uppercase">
              Telecomunicações
            </p>
            <span className="h-px w-8 bg-orange-500/50" />
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <p className="text-slate-400 text-sm text-center mb-6">
            Acesse com sua matrícula e senha
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-0.5">
                Matrícula
              </label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                placeholder="Ex: A0123456"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm uppercase tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-0.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={senhaVisivel ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSenhaVisivel((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {senhaVisivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 text-sm"
            >
              {enviando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
                : 'Entrar no sistema'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Acesso restrito a colaboradores autorizados
        </p>
      </div>

      <style>{`
        @keyframes radar-pulse {
          0%   { transform: scale(0.4); opacity: 0.6; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </div>
  );
}
