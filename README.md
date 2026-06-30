# CMV Dashboard — Kingdom Sushi

Painel web pra gerenciar o controle de CMV. Login via Supabase Auth, regras editáveis em tempo real (espelhadas com o bot Telegram), histórico semanal.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **Recharts** (gráficos)
- **Lucide React** (ícones)

## Páginas
- `/login` — entrar/cadastrar
- `/dashboard` — visão geral semanal + gráfico 8 semanas
- `/regras` — editar regras por fornecedor + ver regras de CMV
- `/historico` — todas as semanas processadas

---

## 🚀 Setup local (10 min)

### 1. Instalar dependências

```bash
cd cmv-dashboard
npm install
```

### 2. Configurar variáveis de ambiente

Copia `.env.example` pra `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` com os valores reais:
- `NEXT_PUBLIC_SUPABASE_URL` — já preenchido
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — pega no [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/agtyburqgtiyavbmezvg/settings/api), seção **Project API keys**, copia a **anon public key**

### 3. Rodar dev server

```bash
npm run dev
```

Abre http://localhost:3000 — vai redirecionar pra `/login`.

### 4. Criar conta

Primeiro acesso: clica em "Cadastrar", usa seu email. Confirma pelo link no email. Volta e faz login.

---

## 🌐 Deploy Vercel (5 min)

### 1. Subir pro GitHub

```bash
cd C:\Users\drale\OneDrive\Documents\Claude\Projects\KINGDOM\cmv-dashboard
git init
git add .
git commit -m "Initial commit: CMV Dashboard"
git branch -M main
gh repo create cmv-dashboard --public --source=. --remote=origin --push
```

(Precisa do `gh` CLI logado — `gh auth login`. Alternativa: cria o repo no GitHub manualmente e dá `git remote add origin URL` + `git push -u origin main`.)

### 2. Importar no Vercel

1. Vai em https://vercel.com/new
2. Login com GitHub
3. Importa o repo `cmv-dashboard`
4. Em **Environment Variables** adiciona:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEFAULT_ORG_ID` = `1`
5. Clica em **Deploy**
6. ~2 min depois, vai pro `cmv-dashboard.vercel.app`

### 3. Adicionar URL no Supabase

Pra Supabase Auth aceitar redirects do Vercel:

1. Supabase Dashboard → Authentication → URL Configuration
2. **Site URL:** `https://cmv-dashboard.vercel.app`
3. **Redirect URLs:** adiciona `https://cmv-dashboard.vercel.app/**` e `http://localhost:3000/**`

Pronto! Acessa o app no celular ou desktop.

---

## 📐 Arquitetura

```
cmv-dashboard/
├── app/                    # Next.js App Router
│   ├── login/              # Página de auth
│   ├── auth/callback/      # OAuth callback (server)
│   └── (app)/              # Grupo autenticado
│       ├── dashboard/      # Visão geral
│       ├── regras/         # CRUD supplier rules
│       └── historico/      # Lista de semanas
├── lib/
│   ├── supabase/           # Clients (browser + server + middleware)
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Helpers de formato
├── components/
│   ├── ui/                 # Botão, input, card, badge
│   ├── nav.tsx             # Sidebar
│   └── cmv-chart.tsx       # Gráfico Recharts
└── middleware.ts           # Auth guard
```

### Banco usado
- `organizations`, `app_users` — multi-tenant
- `invoices`, `items`, `suppliers` — dados das notas
- `org_cmv_rules` — quais categorias contam como CMV (migration 1)
- `org_supplier_rules` — regras por fornecedor (migration 2)

### RLS
Tudo protegido por Row Level Security via função `user_org_id()`. Só vê os dados da própria org. Owner pode editar regras; manager só lê.

---

## 🔄 Próximas features (não implementadas ainda)

- [ ] Download de Excel/PDF on-demand (endpoint backend)
- [ ] Upload de nota manual via web (espelho do bot Telegram)
- [ ] Edição inline de invoices
- [ ] Multi-restaurante (selecionar location)
- [ ] Notificações por email/SMS
- [ ] Comparativo entre fornecedores (ex: $/lb salmão por fornecedor)

---

## 📝 Comandos úteis

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # build de produção
npm run lint     # ESLint
npm run start    # serve build local
```
