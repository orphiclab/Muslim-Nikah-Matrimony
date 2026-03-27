-- Add memberId column with a temporary default so existing rows are handled
ALTER TABLE "ChildProfile" ADD COLUMN "memberId" TEXT;

-- Backfill existing rows with MN-000001, MN-000002, etc. ordered by createdAt
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "ChildProfile"
)
UPDATE "ChildProfile"
SET "memberId" = 'MN-' || LPAD(numbered.rn::TEXT, 6, '0')
FROM numbered
WHERE "ChildProfile".id = numbered.id;

-- Now that all rows have a value, make the column NOT NULL
ALTER TABLE "ChildProfile" ALTER COLUMN "memberId" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "ChildProfile_memberId_key" ON "ChildProfile"("memberId");
