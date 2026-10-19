CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiRateLimit" (
    "key" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "AiKnowledgeDocument" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCANNING',
    "indexedText" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "sessionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiFileAnalysis" (
    "id" TEXT NOT NULL,
    "projectFileId" TEXT NOT NULL,
    "authorizedById" TEXT NOT NULL,
    "authorizationConfirmedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "keyInsights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFileAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiRateLimit_updatedAt_idx" ON "AiRateLimit"("updatedAt");
CREATE UNIQUE INDEX "AiKnowledgeDocument_storageKey_key" ON "AiKnowledgeDocument"("storageKey");
CREATE INDEX "AiKnowledgeDocument_status_createdAt_idx" ON "AiKnowledgeDocument"("status", "createdAt");
CREATE INDEX "AiConversation_createdAt_idx" ON "AiConversation"("createdAt");
CREATE INDEX "AiConversation_userId_createdAt_idx" ON "AiConversation"("userId", "createdAt");
CREATE INDEX "AiConversation_sessionId_createdAt_idx" ON "AiConversation"("sessionId", "createdAt");
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");
CREATE INDEX "SearchQuery_query_createdAt_idx" ON "SearchQuery"("query", "createdAt");
CREATE INDEX "AiFileAnalysis_projectFileId_createdAt_idx" ON "AiFileAnalysis"("projectFileId", "createdAt");
CREATE INDEX "AiFileAnalysis_authorizedById_createdAt_idx" ON "AiFileAnalysis"("authorizedById", "createdAt");

ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiFileAnalysis" ADD CONSTRAINT "AiFileAnalysis_projectFileId_fkey"
FOREIGN KEY ("projectFileId") REFERENCES "ProjectFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiFileAnalysis" ADD CONSTRAINT "AiFileAnalysis_authorizedById_fkey"
FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AiKnowledgeDocument" ADD CONSTRAINT "AiKnowledgeDocument_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
