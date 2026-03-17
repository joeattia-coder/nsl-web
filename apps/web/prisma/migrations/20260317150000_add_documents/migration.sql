CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "showOnPublicDocumentsPage" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_title_idx" ON "Document"("title");
CREATE INDEX "Document_showOnPublicDocumentsPage_updatedAt_idx" ON "Document"("showOnPublicDocumentsPage", "updatedAt");
