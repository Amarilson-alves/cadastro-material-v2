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
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  // O carregando DEVE começar como true para a RotaProtegida esperar
  const [carregando, setCarregando] = useState(true);
  const queryClient = useQueryClient();
  const perfilIdAtual = useRef<string | null>(null);

  useEffect(() => {
    let montado = true;

    const carregarPerfil = async (userId: string) => {
      if (perfilIdAtual.current === userId) {
        console.log(`[PERFIL] skip — já carregado para ${userId.slice(0, 8)}`);
        return;
      }

      console.log(`[PERFIL] buscando para ${userId.slice(0, 8)}...`);
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) { console.error('[PERFIL] erro Supabase:', error.code, error.message); throw error; }

        if (montado) {
          setPerfil(data as Perfil);
          perfilIdAtual.current = userId;
          console.log(`[PERFIL] OK — role=${(data as Perfil).role}`);
        }
      } catch (err) {
        console.error('[PERFIL] falhou:', err);
        if (montado) setPerfil(null);
      } finally {
        if (montado) setCarregando(false);
      }
    };

    // 1. FORÇA A LEITURA DO CACHE AO ABRIR A TELA
    const inicializarSessao = async () => {
      console.log('[INIT] lendo sessão do localStorage...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          console.log('[INIT] sessão encontrada:', session.user.id.slice(0, 8));
          if (montado) setUser(session.user);
          await carregarPerfil(session.user.id);
        } else {
          console.log('[INIT] nenhuma sessão no cache');
          if (montado) { setUser(null); setPerfil(null); setCarregando(false); }
        }
      } catch (err) {
        console.error('[INIT] erro:', err);
        if (montado) { setUser(null); setPerfil(null); setCarregando(false); }
      }
    };

    inicializarSessao();

    // 2. ESCUTA EVENTOS EM TEMPO REAL (E DE OUTRAS ABAS)
    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, sessao) => {
      const ts = new Date().toISOString().slice(11, 23);
      console.log(`[AUTH ${ts}] "${evento}" user=${sessao?.user?.id?.slice(0, 8) ?? 'null'} perfilRef=${perfilIdAtual.current?.slice(0, 8) ?? 'null'}`);

      if (!montado) { console.log(`[AUTH ${ts}] ignorado — desmontado`); return; }

      if (evento === 'SIGNED_OUT') {
        console.log(`[AUTH ${ts}] SIGNED_OUT → limpando tudo`);
        setUser(null);
        setPerfil(null);
        perfilIdAtual.current = null;
        setCarregando(false);
        queryClient.clear();
        return;
      }

      if (sessao?.user) {
        setUser(sessao.user);

        if (evento === 'TOKEN_REFRESHED') {
          console.log(`[AUTH ${ts}] TOKEN_REFRESHED → invalidateQueries`);
          queryClient.invalidateQueries({ predicate: q => q.queryKey[0] !== 'perfil' });
        }

        if (perfilIdAtual.current !== sessao.user.id) {
          console.log(`[AUTH ${ts}] perfil diferente → buscando...`);
          setCarregando(true);
          await carregarPerfil(sessao.user.id);
        } else {
          console.log(`[AUTH ${ts}] perfil já carregado — skip`);
        }
      }
    });

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = async (matricula: string, senha: string) => {
    console.log('[LOGIN] iniciando — limpando token local...');
    try { await supabase.auth.signOut(); } catch { /* ignora erro do fantasma */ }
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    console.log('[LOGIN] chamando signInWithPassword...');
    const { error } = await supabase.auth.signInWithPassword({ email: emailFake, password: senha });
    if (error) { console.error('[LOGIN] erro:', error.message); throw new Error(error.message); }
    console.log('[LOGIN] API retornou OK — aguardando onAuthStateChange...');
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
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