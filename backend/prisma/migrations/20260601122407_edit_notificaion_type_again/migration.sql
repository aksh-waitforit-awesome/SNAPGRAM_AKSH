/*
  Warnings:

  - The values [FOLLOW_REQUEST_REQUESTED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_REQUEST_ACCEPTED', 'FOLLOW_REQUEST_REJECTED', 'LIKE', 'COMMENT', 'COMMENT_LIKE', 'MESSAGE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
