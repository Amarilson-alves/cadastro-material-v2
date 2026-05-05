import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth, AuthProvider } from '@/hooks/useAuth';

import Login from '@/pages/Login';
import Index from '@/pages/Index';
import Campo from '@/pages/Campo';
import Interno from '@/pages/Interno';
import AutoLogout from '@/components/AutoLogout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      // Desativado globalmente: o TOKEN_REFRESHED handler em useAuth dispara
      // invalidateQueries ao voltar de outra aba, evitando a race condition
      // onde o refetch usa o JWT expirado antes do Supabase terminar o refresh.
      refetchOnWindowFocus: false,
    },
  },
});

function RotaProtegida({ children, requireStaff = false }: { children: React.ReactNode, requireStaff?: boolean }) {
  const { user, isStaff, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireStaff && !isStaff) return <Navigate to="/" replace />;

  return (
    <>
      <AutoLogout />
      {children}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RotaProtegida><Index /></RotaProtegida>} />
            <Route path="/campo" element={<RotaProtegida><Campo /></RotaProtegida>} />
            <Route path="/interno" element={<RotaProtegida requireStaff><Interno /></RotaProtegida>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}