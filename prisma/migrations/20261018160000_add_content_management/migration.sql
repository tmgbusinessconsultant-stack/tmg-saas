CREATE TABLE "ContentMedia" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCANNING',
    "publishedLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "galleryImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "author" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishDate" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "openGraphImage" TEXT,
    "canonicalUrl" TEXT,
    "schemaMarkup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CmsSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CmsSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ContentAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentAuditLog_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BlogCategory" ("id", "name", "slug", "updatedAt") VALUES
    ('cms-category-business-consulting', 'Business Consulting', 'business-consulting', CURRENT_TIMESTAMP),
    ('cms-category-ai-solutions', 'AI Solutions', 'ai-solutions', CURRENT_TIMESTAMP),
    ('cms-category-productivity-training', 'Productivity Training', 'productivity-training', CURRENT_TIMESTAMP),
    ('cms-category-leadership-development', 'Leadership Development', 'leadership-development', CURRENT_TIMESTAMP);

CREATE UNIQUE INDEX "ContentMedia_storageKey_key" ON "ContentMedia"("storageKey");
CREATE INDEX "ContentMedia_status_createdAt_idx" ON "ContentMedia"("status", "createdAt");
CREATE INDEX "ContentMedia_contentType_createdAt_idx" ON "ContentMedia"("contentType", "createdAt");
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishDate_idx" ON "BlogPost"("status", "publishDate");
CREATE INDEX "BlogPost_categoryId_status_idx" ON "BlogPost"("categoryId", "status");
CREATE INDEX "GalleryItem_isVisible_displayOrder_idx" ON "GalleryItem"("isVisible", "displayOrder");
CREATE INDEX "GalleryItem_category_isVisible_idx" ON "GalleryItem"("category", "isVisible");
CREATE INDEX "ContentAuditLog_entityType_entityId_createdAt_idx" ON "ContentAuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "ContentAuditLog_actorId_createdAt_idx" ON "ContentAuditLog"("actorId", "createdAt");

ALTER TABLE "ContentMedia"
    ADD CONSTRAINT "ContentMedia_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPost"
    ADD CONSTRAINT "BlogPost_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GalleryItem"
    ADD CONSTRAINT "GalleryItem_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "ContentMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentAuditLog"
    ADD CONSTRAINT "ContentAuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
