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
      // Evita loops infinitos de busca se o ID for o mesmo
      if (perfilIdAtual.current === userId) return;
      
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (montado) {
          setPerfil(data as Perfil);
          perfilIdAtual.current = userId;
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        if (montado) setPerfil(null);
      } finally {
        if (montado) setCarregando(false);
      }
    };

    // 1. FORÇA A LEITURA DO CACHE AO ABRIR A TELA (Ignora o evento fantasma)
    const inicializarSessao = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          if (montado) setUser(session.user);
          await carregarPerfil(session.user.id);
        } else {
          if (montado) {
            setUser(null);
            setPerfil(null);
            setCarregando(false);
          }
        }
      } catch (err) {
        console.error('Sessão fantasma derrubada:', err);
        if (montado) {
          setUser(null);
          setPerfil(null);
          setCarregando(false);
        }
      }
    };

    inicializarSessao();

    // 2. ESCUTA EVENTOS EM TEMPO REAL (E DE OUTRAS ABAS)
    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, sessao) => {
      if (!montado) return;

      if (evento === 'SIGNED_OUT') {
        setUser(null);
        setPerfil(null);
        perfilIdAtual.current = null;
        setCarregando(false);
        queryClient.clear(); // Limpa a memória para não vazar dados para o próximo usuário
        return;
      }

      if (sessao?.user) {
        setUser(sessao.user);
        
        if (evento === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ predicate: q => q.queryKey[0] !== 'perfil' });
        }
        
        // Só busca o perfil de novo se a aba identificou um usuário diferente
        if (perfilIdAtual.current !== sessao.user.id) {
          setCarregando(true);
          await carregarPerfil(sessao.user.id);
        }
      }
    });

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = async (matricula: string, senha: string) => {
    try { await supabase.auth.signOut(); } catch { /* ignora erro do fantasma */ }
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    const { error } = await supabase.auth.signInWithPassword({ email: emailFake, password: senha });
    if (error) throw new Error(error.message);
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