# BudgetSaaS — Sistema de Gestão Orçamentária

Sistema interno de divulgação orçamentária construído com **Next.js 14**, **Tailwind CSS** e **Supabase**.

---

## Pré-requisitos

| Requisito | Versão mínima |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Docker + Docker Compose | 24.x |
| Conta Supabase | — |
| Azure AD App Registration | — |

---

## 1. Configuração do Supabase

### 1.1 Criar as tabelas

No **Supabase Dashboard → SQL Editor**, cole e execute o conteúdo de `supabase/schema.sql`.

### 1.2 Configurar Azure AD como provedor OAuth

1. Acesse **Azure Portal → App registrations → New registration**
2. Configure a redirect URI: `https://<seu-projeto>.supabase.co/auth/v1/callback`
3. Copie **Application (client) ID** e **Client Secret**
4. No **Supabase Dashboard → Authentication → Providers → Azure**:
   - Cole o **Client ID** e **Client Secret**
   - Habilite o provider e salve

### 1.3 Criar o Storage Bucket

No **Supabase Dashboard → Storage**, crie um bucket chamado `uploads` (privado).

---

## 2. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Atenção**: Nunca comite `.env.local` no Git. O arquivo `.env.example` pode ser compartilhado com segurança.

---

## 3. Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 4. Deploy com Docker (On-premise Linux)

### 4.1 Na máquina de build (ou no servidor)

```bash
# Clonar o repositório
git clone <repo-url> budget-saas
cd budget-saas

# Criar o arquivo de variáveis
cp .env.example .env.local
nano .env.local  # preencha com os valores reais

# Build e start
docker compose up -d --build
```

A aplicação estará disponível em `http://<ip-do-servidor>:3000`.

### 4.2 Gerenciamento

```bash
# Ver logs em tempo real
docker compose logs -f

# Parar a aplicação
docker compose down

# Atualizar (rebuild)
git pull
docker compose up -d --build
```

---

## 5. Estrutura do Projeto

```
src/
  app/
    layout.tsx          ← Layout raiz com sidebar
    page.tsx            ← Redireciona para /dashboard
    dashboard/          ← Página principal (Manager + Admin)
    upload/             ← Importação de planilhas (Admin)
    admin/users/        ← Gestão de usuários (Admin)
    auth/
      login/            ← Página de login (Azure AD)
      callback/         ← Handler do OAuth callback
  components/           ← Componentes compartilhados
  lib/
    supabase/           ← Clientes Supabase (browser + server)
    utils.ts            ← Utilitários e computações de dados
  types/                ← Tipos TypeScript compartilhados
  middleware.ts         ← Proteção de rotas por papel
supabase/
  schema.sql            ← Schema do banco + RLS policies
Dockerfile
docker-compose.yml
```

---

## 6. Perfis de Acesso

| Rota | Admin | Manager |
|---|---|---|
| `/dashboard` | ✅ | ✅ (somente seu CC) |
| `/upload` | ✅ | ❌ → redireciona |
| `/admin/users` | ✅ | ❌ → redireciona |

### Adicionar um Admin

Execute no Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@empresa.com';
```

---

## 7. Formato da Planilha de Importação (.xlsx)

| Coluna | Campo | Tipo |
|---|---|---|
| **A** | Descrição | Texto |
| **B** | Categoria | Texto |
| **C** | Janeiro | Número |
| **D** | Fevereiro | Número |
| … | … | … |
| **N** | Dezembro | Número |

A primeira linha é tratada como cabeçalho e ignorada na importação.

---

## 8. Troubleshooting

| Problema | Solução |
|---|---|
| Loop de redirect na tela de login | Verifique `NEXT_PUBLIC_SITE_URL` e a redirect URI no Azure AD |
| Erro 403 no Supabase | Verifique as RLS policies em `supabase/schema.sql` |
| "Usuário não encontrado" ao adicionar gestor | O usuário deve fazer login via SSO ao menos uma vez |
| Build Docker falha | Certifique-se de que `output: 'standalone'` está em `next.config.js` |
