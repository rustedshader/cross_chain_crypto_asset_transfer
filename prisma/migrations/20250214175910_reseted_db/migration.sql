/*
  Warnings:

  - The primary key for the `WhiteListedMerkle` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "WhiteListedMerkle" DROP CONSTRAINT "WhiteListedMerkle_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WhiteListedMerkle_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "WhiteListedMerkle_id_seq";
