import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina classes Tailwind de forma segura
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata SKU no padrão xxxx-xxxx-x
export function formatSKU(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8)}`;
}

// Formata data para exibição em pt-BR
export function formatarData(data: string): string {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR');
}
