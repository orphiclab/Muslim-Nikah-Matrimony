-- User: visibility flags (schema.prisma)
ALTER TABLE "User" ADD COLUMN "phoneVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "whatsappVisible" BOOLEAN NOT NULL DEFAULT true;

-- SiteSettings: payment contact & bank details (schema.prisma)
ALTER TABLE "SiteSettings" ADD COLUMN "whatsappContact" TEXT NOT NULL DEFAULT '+94 705 687 697';
ALTER TABLE "SiteSettings" ADD COLUMN "bank1AccName" TEXT NOT NULL DEFAULT 'M T M Akram';
ALTER TABLE "SiteSettings" ADD COLUMN "bank1AccNo" TEXT NOT NULL DEFAULT '112054094468';
ALTER TABLE "SiteSettings" ADD COLUMN "bank1BankName" TEXT NOT NULL DEFAULT 'Sampath Bank PLC';
ALTER TABLE "SiteSettings" ADD COLUMN "bank1Branch" TEXT NOT NULL DEFAULT 'Ratmalana';
ALTER TABLE "SiteSettings" ADD COLUMN "bank2AccName" TEXT NOT NULL DEFAULT 'M T M Akram';
ALTER TABLE "SiteSettings" ADD COLUMN "bank2AccNo" TEXT NOT NULL DEFAULT '89870069';
ALTER TABLE "SiteSettings" ADD COLUMN "bank2BankName" TEXT NOT NULL DEFAULT 'BOC';
ALTER TABLE "SiteSettings" ADD COLUMN "bank2Branch" TEXT NOT NULL DEFAULT 'Anuradhapura';

-- ChildProfile / Payment: admin rejection notes (schema.prisma)
ALTER TABLE "ChildProfile" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN "rejectionReason" TEXT;
