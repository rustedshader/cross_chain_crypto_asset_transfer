/*
  Warnings:

  - The primary key for the `WhiteListedMerkle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `merkleId` on the `WhiteListedMerkle` table. All the data in the column will be lost.
  - The `id` column on the `WhiteListedMerkle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userAddress` to the `WhiteListedMerkle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WhiteListedMerkle" DROP CONSTRAINT "WhiteListedMerkle_pkey",
DROP COLUMN "merkleId",
ADD COLUMN     "userAddress" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "WhiteListedMerkle_pkey" PRIMARY KEY ("id");
