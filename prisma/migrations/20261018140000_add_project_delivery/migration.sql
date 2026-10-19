CREATE TYPE "ProjectStatus" AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'REVIEW',
    'CLIENT_FEEDBACK',
    'COMPLETED',
    'DELIVERED',
    'ARCHIVED'
);

CREATE TYPE "ProjectFileKind" AS ENUM ('CLIENT_UPLOAD', 'DELIVERABLE');
CREATE TYPE "ProjectFileStatus" AS ENUM ('UPLOADING', 'SCANNING', 'AVAILABLE', 'REJECTED', 'FAILED');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "serviceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "multipartId" TEXT,
    "kind" "ProjectFileKind" NOT NULL,
    "status" "ProjectFileStatus" NOT NULL DEFAULT 'UPLOADING',
    "familyKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectFile_storageKey_key" ON "ProjectFile"("storageKey");
CREATE UNIQUE INDEX "ProjectFile_projectId_familyKey_version_key" ON "ProjectFile"("projectId", "familyKey", "version");
CREATE INDEX "Project_ownerId_updatedAt_idx" ON "Project"("ownerId", "updatedAt");
CREATE INDEX "Project_assigneeId_status_idx" ON "Project"("assigneeId", "status");
CREATE INDEX "Project_status_updatedAt_idx" ON "Project"("status", "updatedAt");
CREATE INDEX "ProjectFile_projectId_kind_status_idx" ON "ProjectFile"("projectId", "kind", "status");
CREATE INDEX "ProjectFile_uploadedById_createdAt_idx" ON "ProjectFile"("uploadedById", "createdAt");
CREATE INDEX "ProjectMessage_projectId_createdAt_idx" ON "ProjectMessage"("projectId", "createdAt");
CREATE INDEX "ProjectActivity_projectId_createdAt_idx" ON "ProjectActivity"("projectId", "createdAt");

ALTER TABLE "Project"
    ADD CONSTRAINT "Project_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Project_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectFile"
    ADD CONSTRAINT "ProjectFile_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ProjectFile_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectMessage"
    ADD CONSTRAINT "ProjectMessage_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ProjectMessage_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectActivity"
    ADD CONSTRAINT "ProjectActivity_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ProjectActivity_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
