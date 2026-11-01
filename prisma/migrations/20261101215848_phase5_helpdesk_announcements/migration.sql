-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "HelpdeskRequest" ADD COLUMN     "repliedBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");

-- CreateIndex
CREATE INDEX "HelpdeskRequest_employeeId_idx" ON "HelpdeskRequest"("employeeId");
