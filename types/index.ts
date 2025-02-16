export interface Transaction {
  id?: string;
  tokenId?: string;
  lockHash?: string;
  mintHash?: string;
  burnHash?: string;
  unlockHash?: string;
  timestamp: number;
  sender: string;
  receiver: string;
  type: string;
  status: "Completed" | "Failed" | "Pending";
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
