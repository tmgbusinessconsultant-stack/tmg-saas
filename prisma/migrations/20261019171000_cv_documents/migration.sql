CREATE TABLE "CvDocument" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CvDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CvDocument_storageKey_key" ON "CvDocument"("storageKey");
CREATE INDEX "CvDocument_ownerId_createdAt_idx" ON "CvDocument"("ownerId", "createdAt");
ALTER TABLE "CvDocument" ADD CONSTRAINT "CvDocument_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
