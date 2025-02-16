// lib/nftUtils.ts
import { NFT } from "@/types";
import { prisma } from "@/lib/prisma";

export interface WrappedNFTInfo {
  isWrapped: boolean;
  originalChain?: string;
  originalContract?: string;
  transferId?: string;
  transaction?: any;
}

export async function getWrappedNFTInfo(
  nft: NFT,
  currentChain: string
): Promise<WrappedNFTInfo> {
  try {
    // Find the active transaction for this NFT
    const transaction = await prisma.transaction.findFirst({
      where: {
        tokenId: nft.identifier,
        isActive: true,
        targetChain: currentChain,
        type: "LOCK_AND_MINT",
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!transaction) {
      return { isWrapped: false };
    }

    return {
      isWrapped: true,
      originalChain: transaction.sourceChain,
      originalContract: transaction.sourceContract,
      transferId: transaction.transferId,
      transaction: transaction
    };
  } catch (error) {
    console.error("Error checking wrapped NFT status:", error);
    return { isWrapped: false };
  }
}