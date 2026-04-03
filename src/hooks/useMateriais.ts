import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMateriais, buscarMateriais } from '@/services/materials';

// Hook para buscar todos os materiais (com cache de 5 minutos)
export function useMateriais() {
  return useQuery({
    queryKey: ['materiais'],
    queryFn: getMateriais,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// Hook para busca com debounce
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
