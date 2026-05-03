import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/types';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarPerfil = async (userId: string) => {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setPerfil(data as Perfil);
  };

  useEffect(() => {
    let montado = true;

    // Única fonte de verdade: onAuthStateChange dispara INITIAL_SESSION imediatamente
    // com a sessão atual, eliminando a corrida entre buscarSessao e o listener.
    const { data: listener } = supabase.auth.onAuthStateChange(async (_evento, sessao) => {
      if (!montado) return;
      const u = sessao?.user ?? null;
      setUser(u);
      if (u) {
        try {
          await carregarPerfil(u.id);
        } catch (err) {
          console.error('Erro ao carregar perfil:', err);
        }
      } else {
        setPerfil(null);
      }
      // Só libera carregando depois que o perfil também estiver carregado
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
    // SIGNED_IN dispara onAuthStateChange que cuida de setUser + carregarPerfil
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Falha de rede ou sessão já inválida — limpa estado local manualmente
      setUser(null);
      setPerfil(null);
    }
  };

  // Helpers de permissão — use esses booleans no código
  const isMaster = perfil?.role === 'master';
  const isStaff  = perfil?.role === 'staff' || isMaster;
  const isTecnico = perfil?.role === 'tecnico';

  return { user, perfil, carregando, login, logout, isMaster, isStaff, isTecnico };
}
