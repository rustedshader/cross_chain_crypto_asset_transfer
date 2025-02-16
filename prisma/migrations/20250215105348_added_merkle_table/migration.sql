-- CreateTable
CREATE TABLE "MerkleRoot" (
    "id" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emails" TEXT[],
    "description" TEXT,

    CONSTRAINT "MerkleRoot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerkleRoot_active_idx" ON "MerkleRoot"("active");
