export type Material = {
  mat_code: string;
  sku: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  categoria: 'Interno' | 'Externo';
};

export type MaterialSelecionado = Material & {
  quantidadeSelecionada: number;
};

// Status possíveis de uma obra no fluxo de aprovação
export type StatusObra = 'aguardando' | 'em_analise' | 'validada' | 'concluida';

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
  obs_admin: string | null;       // Notas internas do admin
  validado_por: string | null;    // Nome do admin que validou
  validado_em: string | null;     // Timestamp da validação
  status: StatusObra | string;
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
  status: string;  // Filtro de status adicionado
};

export type KpisObras = {
  aguardando: number;
  em_analise: number;
  validada: number;
  concluida: number;
};

// Role: tecnico | staff | master
export type Role = 'tecnico' | 'staff' | 'master' | string;

export type Perfil = {
  id: string;
  nome: string;
  matricula: string;
  role: Role;
  criado_em: string;
};
