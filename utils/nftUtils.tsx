import { NFT } from "@/types";

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
    const response = await fetch(
      `/api/nft/wrapped?tokenId=${nft.identifier}&chain=${currentChain}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking wrapped NFT status:", error);
    return { isWrapped: false };
  }
}