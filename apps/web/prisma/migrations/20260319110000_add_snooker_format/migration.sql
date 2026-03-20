-- CreateEnum
CREATE TYPE "SnookerFormat" AS ENUM ('REDS_6', 'REDS_10', 'REDS_15');

-- AlterTable: add nullable snookerFormat column to Tournament (existing rows unaffected)
ALTER TABLE "Tournament" ADD COLUMN "snookerFormat" "SnookerFormat";
