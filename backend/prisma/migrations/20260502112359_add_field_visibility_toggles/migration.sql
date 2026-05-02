-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "showAbout" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showCity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showCivilStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showCountry" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showDressCode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showEducation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showEthnicity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showExpectations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFamilyDetails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showHeight" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOccupation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showWeight" BOOLEAN NOT NULL DEFAULT true;
