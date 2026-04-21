-- CreateTable
CREATE TABLE "SmsOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsOtp_phone_idx" ON "SmsOtp"("phone");
