-- Align ChildProfile with schema: fields that were never in prior migrations.
-- (ProfileStatus enum values moved to a separate migration for PG 12–14 compatibility:
--  "ADD VALUE IF NOT EXISTS" requires PostgreSQL 15+ and could roll back this whole migration.)

ALTER TABLE "ChildProfile" ADD COLUMN "state" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "residencyStatus" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "fieldOfStudy" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "profession" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "fatherEthnicity" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "fatherCountry" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "fatherCity" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "motherEthnicity" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "motherCountry" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "motherCity" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "createdBy" TEXT;
