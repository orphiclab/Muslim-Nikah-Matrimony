-- AlterEnum
ALTER TYPE "ProfileStatus" ADD VALUE 'EDIT_PENDING';

-- CreateTable
CREATE TABLE "ProfileEditRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "previousData" JSONB NOT NULL,
    "newData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileEditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileEditRequest_profileId_idx" ON "ProfileEditRequest"("profileId");

-- CreateIndex
CREATE INDEX "ProfileEditRequest_status_idx" ON "ProfileEditRequest"("status");

-- AddForeignKey
ALTER TABLE "ProfileEditRequest" ADD CONSTRAINT "ProfileEditRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
