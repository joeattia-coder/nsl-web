-- Add nullable registration deadline so existing tournament rows are preserved.
ALTER TABLE "Tournament"
ADD COLUMN "registrationDeadline" TIMESTAMP(3);
