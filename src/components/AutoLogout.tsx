import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AutoLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fazerLogout = async () => {
    // Apaga a sessão do usuário no banco
    await supabase.auth.signOut();
    
    // Mostra a notificação vermelha (opcional, pois a tela de login já vai aparecer)
    toast.error('Sessão expirada por inatividade. Faça login novamente.');
  };

  const resetarCronometro = () => {
    // Se o usuário mexer o mouse, cancela o cronômetro antigo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // ==========================================
    // ⚙️ CONFIGURAÇÃO DO TEMPO AQUI
    // ==========================================
    // 1 minuto = 1 * 60 * 1000 milissegundos (Use isso para testar agora)
    // 30 minutos = 30 * 60 * 1000 milissegundos (Use isso na versão final)
    const TEMPO_INATIVIDADE = 1 * 60 * 1000; 

    // Inicia um novo cronômetro
    timeoutRef.current = setTimeout(fazerLogout, TEMPO_INATIVIDADE);
  };

  useEffect(() => {
    // Inicia o cronômetro assim que o componente carrega
    resetarCronometro();

    // Lista de "sinais de vida" do usuário
    const eventos = [
      'mousemove',  // Mexer o mouse
      'keydown',    // Digitar no teclado
      'wheel',      // Rolar a página
      'touchstart', // Tocar na tela do celular
      'click'       // Clicar em algo
    ];

    // Toda vez que o usuário der um "sinal de vida", o cronômetro reinicia
    eventos.forEach(evento => window.addEventListener(evento, resetarCronometro));

    // Limpeza de segurança quando o usuário sair da página
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      eventos.forEach(evento => window.removeEventListener(evento, resetarCronometro));
    };
  }, []);

  // Como é um componente "fantasma", ele não renderiza nada na tela
  return null; 
}