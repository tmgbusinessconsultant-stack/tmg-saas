-- AlterTable
ALTER TABLE "CvDocument" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'QAR',
ADD COLUMN     "downloadMode" TEXT NOT NULL DEFAULT 'BLOCKED',
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CvPayment" (
    "id" TEXT NOT NULL,
    "cvDocumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CvPayment_cvDocumentId_userId_idx" ON "CvPayment"("cvDocumentId", "userId");

-- CreateIndex
CREATE INDEX "CvPayment_userId_status_idx" ON "CvPayment"("userId", "status");

-- AddForeignKey
ALTER TABLE "CvPayment" ADD CONSTRAINT "CvPayment_cvDocumentId_fkey" FOREIGN KEY ("cvDocumentId") REFERENCES "CvDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvPayment" ADD CONSTRAINT "CvPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
