# Casos e Evidências (WhatsApp)

App Next.js (App Router) para compilar e organizar evidências de WhatsApp (áudios e prints) por **Caso**, com multiusuário e controle de acesso (ACL).

## Stack

- **Next.js** (App Router, TypeScript)
- **Neon Postgres** + **Prisma** (ORM e migrations)
- **Clerk** (autenticação)
- **Vercel Blob** (armazenamento de arquivos)
- **Tailwind** + **shadcn/ui**
- **Zod** (validação server-side)

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

### Neon (Postgres)

- `DATABASE_URL` – URL de conexão com pooler (uso em runtime)
- `DATABASE_URL_UNPOOLED` – URL sem pooler (uso em migrations do Prisma)

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`
- `NEXT_PUBLIC_APP_URL` – URL da app (ex.: `http://localhost:3000`)

### Vercel Blob

- `BLOB_READ_WRITE_TOKEN` – token de leitura/escrita do Blob (upload e download via API)

## Como rodar

```bash
npm install
cp .env.example .env
# Edite .env com as chaves reais
npx prisma migrate deploy   # aplica migrations (ou use db push em dev)
npm run dev
```

## Prisma

- **Gerar cliente:** `npm run db:generate` (ou `npx prisma generate`)
- **Criar nova migration:** `npx prisma migrate dev --name nome_da_migration`
- **Aplicar migrations (produção):** `npx prisma migrate deploy`
- **Abrir Prisma Studio:** `npm run db:studio`

## Clerk

1. Crie uma aplicação em [Clerk Dashboard](https://dashboard.clerk.com).
2. Configure os redirect URLs (sign-in, sign-up, after sign-in) conforme as variáveis acima.
3. Opcional: ative métodos de login (Email, Google, etc.) no dashboard.

## Upload seguro (Blob)

- Os arquivos **não** são públicos por padrão no sentido de “URL fixa exposta”.
- Fluxo:
  1. O cliente chama `POST /api/evidence` com metadados (caseId, type, file_name, etc.). O servidor valida permissão (`requireCaseRole(caseId, 'editor')`), cria o registro de evidência no DB e retorna o `id`.
  2. O cliente envia o arquivo em `POST /api/evidence/[id]/upload` (multipart). O servidor valida de novo, faz o upload para o Vercel Blob com path `cases/{caseId}/evidence/{evidenceId}/{filename}` e atualiza o registro com `blob_url` e metadados.
- Download/visualização: `GET /api/evidence/[id]/download` exige `requireCaseRole(caseId, 'viewer')` e redireciona para a URL do blob. Nenhuma URL permanente de arquivo é exposta ao cliente sem passar por essa API.

## Transcrição de áudio

- Ao criar uma evidência do tipo `audio`, é criado um job de tipo `transcription` (status `queued`).
- **Mock atual:** a UI permite colar/editar a transcrição manualmente; o endpoint `PATCH /api/jobs/[id]` com `status: 'done'` e `transcript_text` atualiza a evidência.
- **Provider real:** para integrar um serviço de transcrição (ex.: Whisper, outro API):
  1. Após criar o job, dispare um worker ou chamada assíncrona que processe o áudio.
  2. Ao concluir, chame `PATCH /api/jobs/[id]` (ou atualize diretamente no DB e no `Evidence`) com o texto e `status: 'done'`.

## Estrutura principal

- **Rotas protegidas:** `/cases`, `/cases/[id]` e `/api/*` (exceto `/api/auth`) exigem sessão Clerk.
- **ACL por caso:** `case_members` com roles `owner` | `editor` | `viewer`. Helpers: `requireAuth()`, `requireCaseRole(caseId, minRole)` em `src/lib/auth/require.ts`.
- **Auditoria:** `logAudit()` em `src/lib/audit.ts` para ações críticas (criação/edição/remoção de caso, evidência, membros, transcrição).

## Arquivos criados/alterados (resumo)

- `prisma/schema.prisma` – modelo de dados (Case, CaseMember, Evidence, EvidenceJob, Tag, Fact, AuditLog, etc.)
- `src/lib/db/prisma.ts` – cliente Prisma e `checkDbConnection`
- `src/lib/auth/require.ts` – `requireAuth`, `requireCaseRole`
- `src/lib/audit.ts` – `logAudit`
- `src/lib/validations/*.ts` – schemas Zod (case, member, evidence, tag, fact, job)
- `src/middleware.ts` – Clerk (proteção de rotas)
- `src/app/layout.tsx` – ClerkProvider, Toaster (sonner)
- `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx` – páginas Clerk
- `src/app/cases/page.tsx`, `src/app/cases/new/page.tsx`, `src/app/cases/[id]/page.tsx` – listagem, criação e detalhe de caso
- `src/app/api/cases/*`, `src/app/api/evidence/*`, `src/app/api/jobs/*`, `src/app/api/tags/route.ts`, `src/app/api/facts/*`, `src/app/api/export/case/[id]/route.ts` – APIs
- `src/components/case/*` – EvidenceUploader, EvidenceCard, Timeline, FactsPanel, MembersPanel, ExportPanel
