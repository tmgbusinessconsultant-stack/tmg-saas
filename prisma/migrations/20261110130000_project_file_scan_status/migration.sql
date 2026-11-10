-- CreateEnum
CREATE TYPE "ProjectFileStatus_new" AS ENUM ('PENDING', 'CLEAN', 'INFECTED');

-- AlterTable
ALTER TABLE "ProjectFile" ALTER COLUMN "status" DROP DEFAULT;

UPDATE "ProjectFile" SET "status" = 'SCANNING' WHERE "status"::text = 'UPLOADING';

ALTER TABLE "ProjectFile"
  ALTER COLUMN "status" TYPE "ProjectFileStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'AVAILABLE' THEN 'CLEAN'
      WHEN "status"::text IN ('REJECTED', 'FAILED') THEN 'INFECTED'
      ELSE 'PENDING'
    END
  )::"ProjectFileStatus_new";

DROP TYPE "ProjectFileStatus";
ALTER TYPE "ProjectFileStatus_new" RENAME TO "ProjectFileStatus";

ALTER TABLE "ProjectFile" ALTER COLUMN "status" SET DEFAULT 'PENDING';

