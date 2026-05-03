import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TEMPO_INATIVIDADE = 30 * 60 * 1000; // 30 minutos
const AVISO_ANTECIPADO  = TEMPO_INATIVIDADE - 5 * 60 * 1000; // avisa 5 min antes

export default function AutoLogout() {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fazerLogout = async () => {
    if (window.location.pathname === '/login') return;
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignora erro de rede — o estado local já foi limpo por scope:'local'
    } finally {
      toast.error('Sessão expirada por inatividade.');
      navigate('/login', { replace: true });
    }
  };

  const resetarCronometro = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      toast.warning('Sessão expirando em 5 minutos', {
        description: 'Clique em "Renovar" para permanecer conectado.',
        action: { label: 'Renovar sessão', onClick: resetarCronometro },
        duration: 5 * 60 * 1000,
      });
    }, AVISO_ANTECIPADO);

    timeoutRef.current = setTimeout(fazerLogout, TEMPO_INATIVIDADE);
  };

  useEffect(() => {
    resetarCronometro();

    const eventos = ['mousemove', 'keydown', 'wheel', 'touchstart', 'click'];
    eventos.forEach(e => window.addEventListener(e, resetarCronometro));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      eventos.forEach(e => window.removeEventListener(e, resetarCronometro));
    };
  }, []);

  return null;
}
