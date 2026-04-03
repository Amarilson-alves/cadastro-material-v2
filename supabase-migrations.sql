-- =============================================
-- EXECUTE ESTE SQL NO SUPABASE:
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- =============================================

-- 1. TABELA DE MATERIAIS
--    Cabeçalho: Mat Code | SKU | Descrição do Material | Unidade | Categoria
create table public.materiais (
  mat_code    text not null,            -- Código interno do material
  sku         text primary key,         -- Código único (chave principal)
  descricao   text not null,            -- Descrição do Material
  unidade     text not null check (unidade in ('KG', 'UN', 'MT', 'CX')),
  categoria   text not null check (categoria in ('Interno', 'Externo')),
  quantidade  integer not null default 0 check (quantidade >= 0),
  criado_em   timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- 2. TABELA DE OBRAS
--    Agora inclui o campo "cidade"
create table public.obras (
  id          uuid primary key default gen_random_uuid(),
  obra_id     text unique,
  tecnico     text not null,
  uf          text not null check (uf in ('PR', 'PRI', 'SC', 'RS')),
  cidade      text not null,            -- ← NOVO CAMPO
  endereco    text not null,
  numero      text not null,
  complemento text,
  tipo_obra   text not null check (tipo_obra in ('Alivio', 'Adequacao')),
  obs         text,
  status      text not null default 'Nova',
  criado_em   timestamptz default now()
);

-- 3. TABELA DE MATERIAIS UTILIZADOS
--    Agora armazena mat_code também
create table public.materiais_utilizados (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras(id) on delete cascade,
  mat_code    text not null,            -- ← NOVO CAMPO
  sku         text not null,
  descricao   text not null,
  unidade     text not null,
  quantidade  integer not null check (quantidade > 0),
  criado_em   timestamptz default now()
);

-- 4. SEGURANÇA: Habilitar Row Level Security (RLS)
alter table public.materiais enable row level security;
alter table public.obras enable row level security;
alter table public.materiais_utilizados enable row level security;

-- 5. POLÍTICAS DE ACESSO (apenas usuários autenticados)
-- Materiais
create policy "Ver materiais" on public.materiais for select to authenticated using (true);
create policy "Inserir materiais" on public.materiais for insert to authenticated with check (true);
create policy "Atualizar materiais" on public.materiais for update to authenticated using (true);
create policy "Deletar materiais" on public.materiais for delete to authenticated using (true);

-- Obras
create policy "Ver obras" on public.obras for select to authenticated using (true);
create policy "Inserir obras" on public.obras for insert to authenticated with check (true);

-- Materiais Utilizados
create policy "Ver materiais utilizados" on public.materiais_utilizados for select to authenticated using (true);
create policy "Inserir materiais utilizados" on public.materiais_utilizados for insert to authenticated with check (true);

-- 6. ÍNDICES para performance
create index on public.materiais (mat_code);
create index on public.materiais (descricao);
create index on public.materiais (categoria);
create index on public.obras (cidade);
create index on public.obras (criado_em desc);
create index on public.materiais_utilizados (obra_id);

-- 7. DADOS DE EXEMPLO (remova se não quiser)
insert into public.materiais (mat_code, sku, descricao, unidade, quantidade, categoria) values
  ('MAT-001', '0001-0001-1', 'Cabo PP 2x1.5mm',   'MT', 100, 'Interno'),
  ('MAT-002', '0001-0001-2', 'Disjuntor 10A',      'UN',  50, 'Interno'),
  ('MAT-003', '0001-0001-3', 'Eletroduto 3/4"',    'MT', 200, 'Externo'),
  ('MAT-004', '0001-0002-1', 'Caixa de Medição',   'UN',  20, 'Externo');
