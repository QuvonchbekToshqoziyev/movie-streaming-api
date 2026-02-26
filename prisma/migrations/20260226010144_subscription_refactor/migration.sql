/*
  Warnings:

  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'REFUNDED', 'CANCELED', 'REMOVED');

-- CreateEnum
CREATE TYPE "MovieType" AS ENUM ('FREE', 'PAID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'CANCELED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Movies" ADD COLUMN     "movieType" "MovieType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "allowed_qualities" "MovieQuality"[];

-- AlterTable
ALTER TABLE "User" RENAME CONSTRAINT "Admin_pkey" TO "User_pkey";

-- RenameIndex
ALTER INDEX "Admin_email_key" RENAME TO "User_email_key";

-- RenameIndex
ALTER INDEX "Admin_username_key" RENAME TO "User_username_key";
