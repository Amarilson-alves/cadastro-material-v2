import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buscarMateriais } from '@/services/materials';

// Hook para busca com debounce — usado no Interno para gerenciar materiais
export function useBuscaMateriais(query: string) {
  const [termoDebouncado, setTermoDebouncado] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setTermoDebouncado(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['busca-materiais', termoDebouncado],
    queryFn: () => buscarMateriais(termoDebouncado),
    enabled: termoDebouncado.trim().length > 0,
    staleTime: 30_000,
  });
}
