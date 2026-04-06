import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AutoLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fazerLogout = async () => {
    // 1. Evita que o cronômetro tente deslogar quem já está na tela de login
    if (window.location.pathname === '/login') return;

    // 2. Apaga a sessão do usuário no banco
    await supabase.auth.signOut();
    
    // 3. Mostra a notificação vermelha
    toast.error('Sessão expirada por inatividade.');

    // 4. FORÇA o navegador a jogar o usuário para a tela de login na mesma hora
    window.location.href = '/login';
  };

  const resetarCronometro = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // ==========================================
    // ⚙️ CONFIGURAÇÃO DO TEMPO AQUI
    // ==========================================
    // 1 minuto = 1 * 60 * 1000 milissegundos (Para teste)
    const TEMPO_INATIVIDADE = 1 * 60 * 1000; 

    timeoutRef.current = setTimeout(fazerLogout, TEMPO_INATIVIDADE);
  };

  useEffect(() => {
    resetarCronometro();

    const eventos = [
      'mousemove',  // Mexer o mouse
      'keydown',    // Digitar no teclado
      'wheel',      // Rolar a página
      'touchstart', // Tocar na tela do celular
      'click'       // Clicar em algo
    ];

    eventos.forEach(evento => window.addEventListener(evento, resetarCronometro));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      eventos.forEach(evento => window.removeEventListener(evento, resetarCronometro));
    };
  }, []);

  return null; 
}