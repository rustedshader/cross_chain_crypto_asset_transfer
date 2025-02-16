/*
  Warnings:

  - Added the required column `sourceChain` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceContract` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetChain` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetContract` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transferId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sourceChain" TEXT NOT NULL,
ADD COLUMN     "sourceContract" TEXT NOT NULL,
ADD COLUMN     "targetChain" TEXT NOT NULL,
ADD COLUMN     "targetContract" TEXT NOT NULL,
ADD COLUMN     "transferId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_transferId_idx" ON "Transaction"("transferId");

-- CreateIndex
CREATE INDEX "Transaction_tokenId_isActive_idx" ON "Transaction"("tokenId", "isActive");
