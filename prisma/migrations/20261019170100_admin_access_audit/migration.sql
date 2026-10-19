ALTER TABLE "User"
  ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';

UPDATE "User" SET "role" = 'ADMIN_MANAGER' WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'CLIENT' WHERE "role" = 'CUSTOMER';

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetId" TEXT,
  "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
