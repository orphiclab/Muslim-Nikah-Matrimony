-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "viewerProfileId" TEXT,
    "viewerName" TEXT,
    "viewerMemberId" TEXT,
    "viewerGender" TEXT,
    "viewerCountry" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileView_profileId_viewedAt_idx" ON "ProfileView"("profileId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileView_viewerProfileId_idx" ON "ProfileView"("viewerProfileId");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerProfileId_fkey" FOREIGN KEY ("viewerProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
