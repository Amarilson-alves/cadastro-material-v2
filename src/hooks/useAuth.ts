// =============================================
// HOOK DE AUTENTICAÇÃO — Seguro e Anti-Travamento
// =============================================
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true; // Evita atualizar a tela se ela já foi fechada

    const buscarSessao = async () => {
      try {
        // 1. Tenta pegar a sessão silenciosamente
        const { data: { session } } = await supabase.auth.getSession();
        const usuarioLogado = session?.user ?? null;
        
        if (montado) setUser(usuarioLogado);

        // 2. Se achou usuário, busca o cargo dele (Staff/Técnico)
        if (usuarioLogado) {
          const { data } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', usuarioLogado.id)
            .single();
            
          if (montado && data) setPerfil(data as Perfil);
        }
      } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
      } finally {
        // 3. A SALVAÇÃO: Independentemente de dar certo ou erro, destrava a tela
        if (montado) setCarregando(false);
      }
    };

    buscarSessao();

    // 4. Escuta apenas para mudanças futuras (Login/Logout), sem causar duplo carregamento
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (montado) {
        setUser(sessao?.user ?? null);
        // Não buscamos o perfil aqui de novo para não gerar loop infinito
      }
    });

    // 🛡️ TRAVA DE SEGURANÇA MÁXIMA: Se o banco de dados falhar silenciosamente,
    // destrava a tela à força após 2.5 segundos para você não ficar preso.
    const timer = setTimeout(() => {
      if (montado && carregando) setCarregando(false);
    }, 2500);

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Função para fazer login via matrícula
  const login = async (matricula: string, senha: string) => {
    const emailFake = `${matricula.toUpperCase()}@cadastro.fake`;
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: emailFake, 
      password: senha 
    });
    
    if (error) throw new Error(error.message);

    // Imediatamente após o login, forçamos a busca do perfil para a sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: p } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
      if (p) setPerfil(p as Perfil);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
  };

  return { user, perfil, carregando, login, logout };
}