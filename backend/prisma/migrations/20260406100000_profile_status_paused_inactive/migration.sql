-- Align ProfileStatus enum with schema.prisma (PAUSED, INACTIVE).
-- Plain ADD VALUE works on PostgreSQL 12+. If a value already exists, this migration
-- will fail; use `prisma migrate resolve` after fixing the DB, or add values manually once.

ALTER TYPE "ProfileStatus" ADD VALUE 'PAUSED';
ALTER TYPE "ProfileStatus" ADD VALUE 'INACTIVE';
