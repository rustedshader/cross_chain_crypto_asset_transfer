/*
  Warnings:

  - Added the required column `emailProofs` to the `MerkleRoot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MerkleRoot" ADD COLUMN     "emailProofs" JSONB NOT NULL;
