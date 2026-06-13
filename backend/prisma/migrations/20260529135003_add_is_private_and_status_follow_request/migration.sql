-- CreateEnum
CREATE TYPE "FollowRequesStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REQUESTED');

-- AlterTable
ALTER TABLE "Follows" ADD COLUMN     "status" "FollowRequesStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
