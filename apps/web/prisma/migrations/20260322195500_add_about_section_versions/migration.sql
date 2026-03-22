CREATE TABLE "AboutSectionVersion" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "contentHtml" TEXT NOT NULL,
  "contentJson" JSONB,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AboutSectionVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AboutSectionVersion_publishedAt_createdAt_idx"
ON "AboutSectionVersion"("publishedAt" DESC, "createdAt" DESC);