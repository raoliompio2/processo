-- Execute no Neon: Console do projeto -> SQL Editor
-- Isso aplica a coluna sort_order e registra a migration sem usar Prisma (evita advisory lock).

-- 1) Adiciona a coluna
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER;

-- 2) Cria _prisma_migrations se não existir (estrutura padrão Prisma)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- 3) Registra a migration da sort_order como aplicada (só se ainda não estiver)
INSERT INTO "_prisma_migrations" (
    "id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count"
)
SELECT
    gen_random_uuid()::text,
    'e6d371da8e2c47962cc51387db78090bf558427ec537679ce060fed3fc38f9f1',
    now(),
    '20250219170000_evidence_sort_order',
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20250219170000_evidence_sort_order'
);

-- 4) Baseline: registra as duas primeiras migrations (para não dar P3005 no próximo deploy)
INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","started_at","applied_steps_count")
SELECT gen_random_uuid()::text, '42ba15579e098e560f046e6a4a8f104d1995f994728148051eb4f55c6c9b7bf4', now(), '20250219160000_init_casos_evidence', now(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20250219160000_init_casos_evidence');

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","started_at","applied_steps_count")
SELECT gen_random_uuid()::text, 'f7df7c160a8461632346cf8510301e56522d93e65aa066e10a4ce737121f9df9', now(), '20250220000000_add_users_sessions', now(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20250220000000_add_users_sessions');
