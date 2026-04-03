import { useState, useEffect, useRef } from 'react';
import { buscarCidades, type Cidade } from '@/services/cidades';
import { MapPin, Loader2, X } from 'lucide-react';

interface CidadeInputProps {
  value: string;
  onChange: (nome: string, cluster?: string) => void;
  placeholder?: string;
  className?: string;
}

export function CidadeInput({ value, onChange, placeholder = 'Ex: Curitiba', className = '' }: CidadeInputProps) {
  const [sugestoes, setSugestoes] = useState<Cidade[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false);
        setHighlightIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (texto: string) => {
    onChange(texto, undefined);
    setHighlightIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!texto.trim()) { setSugestoes([]); setAberto(false); return; }
    debounceRef.current = setTimeout(async () => {
      setCarregando(true);
      try {
        const res = await buscarCidades(texto);
        setSugestoes(res);
        setAberto(true);
      } catch { setSugestoes([]); }
      finally { setCarregando(false); }
    }, 250);
  };

  const handleSelecionar = (cidade: Cidade) => {
    onChange(cidade.nome, cidade.cluster);
    setSugestoes([]);
    setAberto(false);
    setHighlightIdx(-1);
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, sugestoes.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); handleSelecionar(sugestoes[highlightIdx]); }
    if (e.key === 'Escape') { setAberto(false); setHighlightIdx(-1); }
  };

  const temCidadeExata = sugestoes.some(c => c.nome.toLowerCase() === value.toLowerCase());

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-smooth"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {carregando
            ? <Loader2 className="h-4 w-4 text-gray-300 animate-spin" />
            : value && <button type="button" onClick={() => { onChange('', undefined); setSugestoes([]); setAberto(false); inputRef.current?.focus(); }}><X className="h-4 w-4 text-gray-300 hover:text-gray-500 transition-smooth" /></button>
          }
        </div>
      </div>

      {/* Dropdown */}
      {aberto && (sugestoes.length > 0 || (value.trim() && !temCidadeExata)) && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          <ul className="max-h-56 overflow-y-auto py-1">
            {sugestoes.map((cidade, idx) => (
              <li key={cidade.id}
                onMouseDown={() => handleSelecionar(cidade)}
                onMouseEnter={() => setHighlightIdx(idx)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-smooth ${
                  idx === highlightIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{cidade.nome}</span>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cidade.cluster}</span>
              </li>
            ))}
            {/* Opção livre */}
            {value.trim() && !temCidadeExata && (
              <li onMouseDown={() => { onChange(value, undefined); setAberto(false); }}
                className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-amber-50 border-t border-gray-100 transition-smooth">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">Usar "<span className="font-semibold text-gray-700">{value}</span>"</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
