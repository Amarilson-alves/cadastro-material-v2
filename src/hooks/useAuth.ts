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

    const buscarSessao = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const usuarioLogado = session?.user ?? null;
        if (montado) setUser(usuarioLogado);
        if (usuarioLogado) await carregarPerfil(usuarioLogado.id);
      } catch (erro) {
        console.error('Erro ao validar sessão:', erro);
      } finally {
        if (montado) setCarregando(false);
      }
    };

    buscarSessao();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_evento, sessao) => {
      if (!montado) return;
      const u = sessao?.user ?? null;
      setUser(u);
      if (u) {
        await carregarPerfil(u.id);
      } else {
        setPerfil(null);
      }
    });

    const timer = setTimeout(() => {
      if (montado) setCarregando(false);
    }, 2500);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await carregarPerfil(session.user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
  };

  // Helpers de permissão — use esses booleans no código
  const isMaster = perfil?.role === 'master';
  const isStaff  = perfil?.role === 'staff' || isMaster;
  const isTecnico = perfil?.role === 'tecnico';

  return { user, perfil, carregando, login, logout, isMaster, isStaff, isTecnico };
}
