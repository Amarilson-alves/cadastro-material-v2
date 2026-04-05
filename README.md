# 🏗️ Controle de Materiais de Obras (V2)

Um sistema web completo, responsivo e seguro para o controle de consumo de materiais em campo. Desenvolvido para conectar o trabalho dos técnicos na rua com a gestão administrativa no escritório, permitindo auditoria, controle de equipe e exportação de dados.

## ✨ Funcionalidades Principais

* **Autenticação e Autorização:** Sistema de login com separação de perfis (`Técnico` e `Staff/Admin`).
* **Gestão de Obras (Campo):** Interface fluida para os técnicos registrarem o consumo de materiais por obra/site.
* **Gestão de Equipe (Admin):** Painel administrativo para criar, editar, inativar e deletar acessos de usuários.
* **Relatórios Corporativos:** Geração de planilhas Excel avançadas (`.xlsx`) com múltiplas abas (Resumo e Detalhamento de Materiais), colunas redimensionadas e inclusão de observações.
* **Segurança Enterprise:** Gerenciamento de acessos isolado no backend através de **Supabase Edge Functions**, garantindo que chaves de banco de dados (`Service Role Key`) nunca sejam expostas ao frontend.
* **Bot de Testes:** Script de automação integrado para popular e limpar o banco de dados com dados fictícios para homologação.

---

## 🚀 Tecnologias Utilizadas

**Frontend:**
* [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript)
* [Tailwind CSS](https://tailwindcss.com/) (Estilização responsiva)
* [TanStack Query / React Query](https://tanstack.com/query/latest) (Gerenciamento de estado e cache)
* [XLSX](https://www.npmjs.com/package/xlsx) (Geração de planilhas Excel)
* [Lucide React](https://lucide.dev/) (Ícones)
* [Sonner](https://sonner.emilkowal.ski/) (Notificações toast)

**Backend / Infraestrutura:**
* [Supabase](https://supabase.com/) (PostgreSQL Database)
* **Supabase Auth** (Gerenciamento de sessões)
* **Supabase Edge Functions** (Deno - API Serverless para lógica de negócios crítica)
* **Gatilhos SQL (Triggers):** Sincronização automática entre `auth.users` e a tabela pública de `perfis`.

---

## 🔒 Arquitetura de Segurança

Na V2 do projeto, a segurança foi elevada ao padrão Enterprise:
1.  **Zero-Trust no Frontend:** A aplicação web utiliza apenas a `ANON_KEY` para leitura de dados públicos.
2.  **Edge Functions (Serverless):** Operações sensíveis, como a criação e deleção de contas de técnicos, são enviadas para uma Edge Function isolada no Supabase.
3.  **Validação de Crachá (JWT):** A Edge Function intercepta requisições, exige o token JWT do administrador logado, e só então executa a ação utilizando a chave `SERVICE_ROLE` guardada em cofre na nuvem.

---

## ⚙️ Como Rodar Localmente

### 1. Pré-requisitos
* [Node.js](https://nodejs.org/en/) instalado (versão 18+ recomendada)
* Conta ativa no [Supabase](https://supabase.com/)
* Conta ativa no [GitHub](https://github.com/) e [Vercel](https://vercel.com/) (para deploy)

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone [https://github.com/SEU_USUARIO/cadastro-material-v2.git](https://github.com/SEU_USUARIO/cadastro-material-v2.git)
cd cadastro-material-v2
npm install

#### 4. Rodando o Servidor Frontend
npm run dev

☁️ Deploy das Edge Functions (Backend)

# 1. Instalar as ferramentas do Supabase
npm install supabase --save-dev

# 2. Fazer login no terminal
npx supabase login

# 3. Ligar ao seu projeto na nuvem
npx supabase link --project-ref SEU_PROJECT_ID

# 4. Enviar a função (Ignorando a verificação externa de JWT, pois fazemos internamente)
npx supabase functions deploy gerenciar-usuarios --no-verify-jwt

🤖 Bot de Testes Automáticos

# Para popular o banco com dezenas de obras e materiais fictícios:
node scripts/bot.js popular

# Para limpar apenas os dados de teste gerados pelo bot:
node scripts/bot.js limpar