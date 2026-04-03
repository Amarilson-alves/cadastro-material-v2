import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, HardHat } from 'lucide-react';

export default function Login() {
  const { user, carregando, login } = useAuth();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Redireciona se já estiver logado
  if (!carregando && user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação da Regra: 1 letra + 5 a 8 números
    const regex = /^[A-Za-z]\d{5,8}$/;
    if (!regex.test(matricula)) {
      toast.error('Formato inválido. Use 1 letra e 5-8 números.');
      return;
    }

    setEnviando(true);
    try {
      await login(matricula, senha);
      toast.success('Bem-vindo ao sistema!');
    } catch (err) {
      toast.error('Credenciais inválidas.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
      {/* Elementos de fundo modernos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4 z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-xl backdrop-blur-sm">
            <HardHat className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acesso ao Sistema</h1>
          <p className="text-slate-400 text-sm mt-1">Entre com sua matrícula e senha</p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Matrícula
              </label>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                placeholder="Ex: A0123456"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-2"
            >
              {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}