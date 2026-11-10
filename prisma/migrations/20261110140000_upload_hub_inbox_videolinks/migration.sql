-- CreateEnum
CREATE TYPE "VideoLinkType" AS ENUM ('YOUTUBE', 'TIKTOK');

-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('NEW', 'SEEN', 'DELIVERED');

-- AlterTable
ALTER TABLE "ProjectFile" ADD COLUMN "inboxStatus" "InboxStatus" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "VideoLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "VideoLinkType" NOT NULL,
    "title" TEXT,
    "inboxStatus" "InboxStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFile_inboxStatus_createdAt_idx" ON "ProjectFile"("inboxStatus", "createdAt");

-- CreateIndex
CREATE INDEX "VideoLink_projectId_createdAt_idx" ON "VideoLink"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoLink_inboxStatus_createdAt_idx" ON "VideoLink"("inboxStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoLink" ADD CONSTRAINT "VideoLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoLink" ADD CONSTRAINT "VideoLink_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

