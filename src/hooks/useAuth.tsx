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
  const queryClient = useQueryClient();
  const carregandoPerfilRef = useRef(false);

  useEffect(() => {
    let montado = true;

    const carregarPerfil = async (userId: string) => {
      if (carregandoPerfilRef.current) return;
      carregandoPerfilRef.current = true;
      try {
        const { data } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', userId)
          .single();
        if (montado) setPerfil(data ? (data as Perfil) : null);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        if (montado) setPerfil(null);
      } finally {
        carregandoPerfilRef.current = false;
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, sessao) => {
      if (!montado) return;
      const u = sessao?.user ?? null;
      setUser(u);

      if (u) {
        if (evento === 'TOKEN_REFRESHED') {
          // JWT renovado — invalida queries que falharam com 401 durante o refresh.
          // O perfil não muda, então não recarregamos.
          queryClient.invalidateQueries({
            predicate: q => q.queryKey[0] !== 'perfil',
          });
          if (montado) setCarregando(false);
          return;
        }
        // Mantém carregando=true até o perfil estar pronto para evitar redirect
        // prematuro no Login.tsx antes de perfil ser populado.
        if (montado) setCarregando(true);
        await carregarPerfil(u.id);
      } else {
        setPerfil(null);
      }
      if (montado) setCarregando(false);
    });

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
    // Limpa tokens residuais do localStorage antes de iniciar nova sessão.
    // Evita que um refresh token expirado/inválido bloqueie o novo login.
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignora */ }
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    const { error } = await supabase.auth.signInWithPassword({ email: emailFake, password: senha });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      setUser(null);
      setPerfil(null);
    }
  };

  const isMaster  = perfil?.role === 'master';
  const isStaff   = perfil?.role === 'staff' || isMaster;
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
