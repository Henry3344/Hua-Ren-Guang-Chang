-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "lastAvatarChangeAt" TIMESTAMP(3),
ADD COLUMN     "lastNameChangeAt" TIMESTAMP(3);
