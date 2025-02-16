export interface Transaction {
  id?: string;
  userId: string;
  tokenId: string;
  transferId: string;              // Used to track the same transfer across chains
  sourceChain: string;            // Chain where the original NFT exists
  targetChain: string;            // Chain where wrapped NFT is/will be minted
  sourceContract: string;         // Original NFT contract address
  targetContract: string;         // Wrapped NFT contract address
  lockHash?: string;             // Hash of the lock transaction
  mintHash?: string;             // Hash of the mint transaction
  burnHash?: string;             // Hash of the burn transaction
  unlockHash?: string;           // Hash of the unlock transaction
  timestamp: number;
  sender: string;                // Address initiating the transfer
  receiver: string;              // Address receiving the NFT
  type: string;//"LOCK_AND_MINT" | "BURN_AND_UNLOCK";  // Type of bridge operation
  status:string; //"Pending" | "Completed" | "Failed";
  isActive: boolean;             // Indicates if the NFT is currently bridged
}

export interface NFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  display_image_url: string;
  display_animation_url: string | null;
  metadata_url: string | null;
  opensea_url: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  wrappedInfo?: any;
}

// Assume your Redux store has a wallet slice at state.wallet.
// For TypeScript, you might have a RootState type defined in your store.
export interface RootState {
    wallet: {
      address: string;
      balance: number;
      chain: string;
      isConnected: boolean;
    };
  }

export interface ContractError extends Error {
  data?: {
    data?: string;
    reason?: string;
  };
  reason?: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
