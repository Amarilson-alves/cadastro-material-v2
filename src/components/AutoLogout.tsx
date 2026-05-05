import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TEMPO_INATIVIDADE = 30 * 60 * 1000;
const AVISO_ANTECIPADO  = TEMPO_INATIVIDADE - 5 * 60 * 1000;

export default function AutoLogout() {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const timeoutRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef   = useRef<number>(Date.now());

  const fazerLogout = async () => {
    if (window.location.pathname === '/login') return;
    try { await logout(); } catch { /* logout já trata falha de rede internamente */ }
    toast.error('Sessão expirada por inatividade.');
    navigate('/login', { replace: true });
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

    const handleActivity = () => {
      const agora = Date.now();
      // Throttle: ignora eventos mais frequentes que 1 segundo (ex: mousemove contínuo)
      if (agora - lastActivityRef.current < 1000) return;
      lastActivityRef.current = agora;
      resetarCronometro();
    };

    const eventos = ['mousemove', 'keydown', 'wheel', 'touchstart', 'click'];
    eventos.forEach(e => window.addEventListener(e, handleActivity));

    // Pausa o timer quando o usuário troca de aba e reinicia ao voltar.
    // Sem isso, o browser throttle acumula o tempo em background e o
    // logout dispara assim que a aba fica ativa novamente.
    const handleVisibility = () => {
      if (document.hidden) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      } else {
        lastActivityRef.current = Date.now();
        resetarCronometro();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      eventos.forEach(e => window.removeEventListener(e, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}
