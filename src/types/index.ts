export type Material = {
  mat_code: string;
  sku: string;
  descricao: string;
  unidade: 'KG' | 'UN' | 'MT' | 'CX';
  quantidade: number;
  categoria: 'Interno' | 'Externo';
};

export type MaterialSelecionado = Material & {
  quantidadeSelecionada: number;
};

export type Obra = {
  id: string;
  obra_id: string | null;
  tecnico: string;
  uf: string;
  cidade: string;
  cluster: string | null;
  endereco: string;
  numero: string;
  complemento: string | null;
  tipo_obra: string;
  obs: string | null;
  status: string;
  criado_em: string;
  materiais_utilizados?: MateriaisUtilizados[];
};

export type MateriaisUtilizados = {
  id: string;
  obra_id: string;
  mat_code: string;
  sku: string;
  descricao: string;
  unidade: string;
  quantidade: number;
};

export type FiltrosObra = {
  endereco: string;
  tecnico: string;
  cidade: string;
  uf: string;
  tipo_obra: string;
  data_de: string;
  data_ate: string;
};

// 👇 TIPAGENS NOVAS ADICIONADAS AQUI
export type Role = 'tecnico' | 'staff';

export type Perfil = {
  id: string;
  nome: string;
  matricula: string;
  role: Role;
  criado_em: string;
};