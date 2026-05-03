import { createContext, useContext, useState, useEffect, type ReactNode, createElement } from 'react';
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

  useEffect(() => {
    let montado = true;

    const carregarPerfil = async (userId: string) => {
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();
      if (montado) setPerfil(data ? (data as Perfil) : null);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_evento, sessao) => {
      if (!montado) return;
      const u = sessao?.user ?? null;
      setUser(u);
      if (u) {
        try {
          await carregarPerfil(u.id);
        } catch (err) {
          console.error('Erro ao carregar perfil:', err);
          if (montado) setPerfil(null);
        }
      } else {
        setPerfil(null);
      }
      if (montado) setCarregando(false);
    });

    // Fallback: evita loading infinito em caso de falha no evento
    const timer = setTimeout(() => {
      if (montado) setCarregando(false);
    }, 3000);

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (matricula: string, senha: string) => {
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    const { error } = await supabase.auth.signInWithPassword({ email: emailFake, password: senha });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      setUser(null);
      setPerfil(null);
    }
  };

  const isMaster  = perfil?.role === 'master';
  const isStaff   = perfil?.role === 'staff' || isMaster;
  const isTecnico = perfil?.role === 'tecnico';

  return createElement(
    AuthContext.Provider,
    { value: { user, perfil, carregando, login, logout, isMaster, isStaff, isTecnico } },
    children,
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
