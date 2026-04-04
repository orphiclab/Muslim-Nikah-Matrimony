-- AlterTable: align User with schema (whatsappNumber)
ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT;

-- AlterTable: align SiteSettings with schema (platformCurrency)
ALTER TABLE "SiteSettings" ADD COLUMN "platformCurrency" TEXT NOT NULL DEFAULT 'LKR';
