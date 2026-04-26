-- AlterEnum
ALTER TYPE "ProfileStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "extraQualification" TEXT,
ADD COLUMN     "residentCity" TEXT,
ADD COLUMN     "residentCountry" TEXT;
