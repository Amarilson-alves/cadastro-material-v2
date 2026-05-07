import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/types';

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  carregando: boolean;
  login: (matricula: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  isMaster: boolean;
  isStaff: boolean;
  isTecnico: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const queryClient   = useQueryClient();
  const perfilIdAtual = useRef<string | null>(null);

  useEffect(() => {
    let montado = true;

    const carregarPerfil = async (userId: string) => {
      if (perfilIdAtual.current === userId) {
        console.log(`[PERFIL] skip — já carregado ${userId.slice(0, 8)}`);
        if (montado) setCarregando(false);
        return;
      }

      console.log(`[PERFIL] buscando ${userId.slice(0, 8)}...`);

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn('[PERFIL] timeout 6s — sessão zumbi');
          reject(new Error('PERFIL_TIMEOUT'));
        }, 6000);
      });

      try {
        const { data, error } = await Promise.race([
          supabase.from('perfis').select('*').eq('id', userId).single(),
          timeoutPromise,
        ]);

        if (error) { console.error('[PERFIL] erro:', error.code, error.message); throw error; }

        if (montado) {
          setPerfil(data as Perfil);
          perfilIdAtual.current = userId;
          console.log(`[PERFIL] OK — role=${(data as Perfil).role}`);
        }
      } catch (err: unknown) {
        console.error('[PERFIL] falhou:', err);
        // Limpa estado local — NÃO chama supabase.auth.* aqui.
        // Chamar signOut dentro do catch causa deadlock secundário (lock do Supabase).
        // O login() seguinte fará signOut({ scope:'local' }) fora do contexto do lock.
        if (montado) {
          setPerfil(null);
          setUser(null);
          perfilIdAtual.current = null;
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (montado) setCarregando(false);
      }
    };

    // IMPORTANTE: callback é SÍNCRONO.
    // O Supabase mantém o lock de auth ativo enquanto executa este callback.
    // Qualquer chamada async ao Supabase aqui (incluindo supabase.from() que internamente
    // chama getSession()) tenta adquirir o mesmo lock → deadlock.
    // Usamos setTimeout(0) para deferir carregarPerfil fora do escopo do lock.
    const { data: listener } = supabase.auth.onAuthStateChange((evento, sessao) => {
      const ts = new Date().toISOString().slice(11, 23);
      console.log(`[AUTH ${ts}] "${evento}" user=${sessao?.user?.id?.slice(0, 8) ?? 'null'} perfilRef=${perfilIdAtual.current?.slice(0, 8) ?? 'null'}`);

      if (!montado) return;

      if (evento === 'SIGNED_OUT') {
        setUser(null);
        setPerfil(null);
        perfilIdAtual.current = null;
        setCarregando(false);
        queryClient.clear();
        return;
      }

      if (evento === 'TOKEN_REFRESHED') {
        if (sessao?.user) setUser(sessao.user);
        queryClient.invalidateQueries({ predicate: q => q.queryKey[0] !== 'perfil' });
        return;
      }

      if (sessao?.user) {
        setUser(sessao.user);
        if (perfilIdAtual.current !== sessao.user.id) {
          setCarregando(true);
          const userId = sessao.user.id;
          // setTimeout(0): garante que carregarPerfil roda APÓS o lock ser liberado
          setTimeout(() => { if (montado) carregarPerfil(userId); }, 0);
        } else {
          console.log(`[AUTH ${ts}] perfil já carregado — skip`);
          setCarregando(false);
        }
      } else {
        // INITIAL_SESSION com sessão nula = não há usuário logado
        setCarregando(false);
      }
    });

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = async (matricula: string, senha: string) => {
    console.log('[LOGIN] limpando token local...');
    // scope:'local' remove do localStorage sem chamar servidor.
    // Necessário quando há token expirado/zumbi no cache após fechar o navegador.
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignora */ }
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    console.log('[LOGIN] chamando signInWithPassword...');
    const { error } = await supabase.auth.signInWithPassword({ email: emailFake, password: senha });
    if (error) { console.error('[LOGIN] erro:', error.message); throw new Error(error.message); }
    console.log('[LOGIN] OK — aguardando onAuthStateChange...');
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } finally {
      setUser(null);
      setPerfil(null);
      perfilIdAtual.current = null;
    }
  };

  const isMaster  = perfil?.role === 'master' || user?.user_metadata?.role === 'master';
  const isStaff   = perfil?.role === 'staff' || perfil?.role === 'master' || isMaster;
  const isTecnico = perfil?.role === 'tecnico';

  return (
    <AuthContext.Provider value={{ user, perfil, carregando, login, logout, isMaster, isStaff, isTecnico }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
