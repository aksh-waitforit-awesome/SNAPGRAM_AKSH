/*
  Warnings:

  - You are about to drop the column `isRead` on the `Message` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "isRead",
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';
