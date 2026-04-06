import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

import Login from '@/pages/Login';
import Index from '@/pages/Index';
import Campo from '@/pages/Campo';
import Interno from '@/pages/Interno';
import AutoLogout from '@/components/AutoLogout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

// AutoLogout montado apenas dentro de rotas protegidas — não roda na tela de Login
function RotaProtegida({ children, requireStaff = false }: { children: React.ReactNode, requireStaff?: boolean }) {
  const { user, perfil, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireStaff && perfil?.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

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
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RotaProtegida><Index /></RotaProtegida>} />
          <Route path="/campo" element={<RotaProtegida><Campo /></RotaProtegida>} />
          <Route path="/interno" element={<RotaProtegida requireStaff><Interno /></RotaProtegida>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
