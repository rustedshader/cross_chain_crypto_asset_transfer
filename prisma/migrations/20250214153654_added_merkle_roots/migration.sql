-- CreateTable
CREATE TABLE "WhiteListedMerkle" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "merkleId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhiteListedMerkle_pkey" PRIMARY KEY ("id")
);
