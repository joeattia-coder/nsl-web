CREATE TABLE "TermsOfServiceVersion" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentHtml" TEXT NOT NULL,
  "contentJson" JSONB,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TermsOfServiceVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TermsOfServiceVersion_publishedAt_createdAt_idx"
ON "TermsOfServiceVersion"("publishedAt" DESC, "createdAt" DESC);