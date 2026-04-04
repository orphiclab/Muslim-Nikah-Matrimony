-- Align ProfileStatus enum with schema.prisma (PAUSED, INACTIVE)
ALTER TYPE "ProfileStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "ProfileStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';

-- Align ChildProfile with schema: fields that were never in prior migrations
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
