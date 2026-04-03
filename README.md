# 🏗️ Cadastro de Materiais v2.0

Sistema de gerenciamento de obras e materiais com autenticação segura via Supabase.

---

## ✅ O que mudou em relação à versão anterior

| Antes | Agora |
|-------|-------|
| Sem login — qualquer pessoa acessava | **Login obrigatório** com email e senha |
| URL do backend exposta no código | **Variáveis de ambiente** no `.env` |
| Google Apps Script frágil | **Supabase** — banco real, seguro, gratuito |
| ~40 dependências (maioria não usada) | **~10 dependências** essenciais |
| 0 testes | Estrutura pronta para testes |
| Código duplicado no Interno.tsx | **Uma única camada de serviço** |

---

## 🚀 Como colocar o sistema no ar (passo a passo)

### PASSO 1 — Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **"New Project"** e dê um nome ao projeto
3. Aguarde o projeto ser criado (~1 minuto)

### PASSO 2 — Criar as tabelas no banco

1. No painel do Supabase, clique em **"SQL Editor"** no menu esquerdo
2. Clique em **"New Query"**
3. Abra o arquivo `supabase-migrations.sql` deste projeto
4. Cole todo o conteúdo e clique em **"Run"**
5. Deve aparecer a mensagem "Success" ✅

### PASSO 3 — Criar usuários para login

1. No painel do Supabase, vá em **"Authentication" > "Users"**
2. Clique em **"Add user"**
3. Cadastre os emails e senhas dos técnicos e administradores

### PASSO 4 — Pegar as credenciais do Supabase

1. No painel, vá em **"Settings" > "API"**
2. Copie o **"Project URL"** e o **"anon public"** key

### PASSO 5 — Configurar o projeto localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/sheet-craft-builder-v2.git
cd sheet-craft-builder-v2

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente
cp .env.example .env
```

4. Abra o arquivo `.env` e preencha com os valores do Passo 4:
```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

### PASSO 6 — Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

### PASSO 7 — Deploy no Vercel (site na internet)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita
2. Clique em **"New Project"** e importe seu repositório do GitHub
3. Em **"Environment Variables"**, adicione as duas variáveis do `.env`
4. Clique em **"Deploy"** ✅

O site ficará disponível em uma URL pública para todos os dispositivos.

---

## 📁 Estrutura do Projeto

```
src/
├── hooks/
│   ├── useAuth.ts         # Login, logout, sessão
│   └── useMateriais.ts    # Busca de materiais com cache
├── lib/
│   ├── supabase.ts        # Conexão com o banco
│   └── utils.ts           # Funções auxiliares
├── pages/
│   ├── Login.tsx          # Tela de login
│   ├── Index.tsx          # Seleção de perfil
│   ├── Campo.tsx          # Técnicos
│   └── Interno.tsx        # Administração
├── services/
│   ├── materials.ts       # CRUD de materiais
│   └── obras.ts           # Salvar e consultar obras
├── types/
│   └── index.ts           # Tipos TypeScript
└── utils/
    └── exportExcel.ts     # Exportação para Excel
```

---

## 🔒 Segurança implementada

- **Autenticação** obrigatória em todas as páginas
- **Row Level Security (RLS)** no banco: dados só acessíveis por usuários logados
- **Variáveis de ambiente**: credenciais nunca ficam no código-fonte
- **Sem backend próprio**: o Supabase é o backend — seguro e gerenciado

---

## ❓ Dúvidas frequentes

**Como adicionar um novo usuário?**
No painel do Supabase > Authentication > Users > Add user

**Como ver os dados diretamente?**
No painel do Supabase > Table Editor

**Como fazer backup?**
No painel do Supabase > Database > Backups (automático no plano gratuito)
