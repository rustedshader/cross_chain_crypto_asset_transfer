export interface Transaction {
    lockHash?: string;
    mintHash?: string;
    burnHash?: string;
    unlockHash?: string;
    timestamp: number;
    sender: string;
    receiver: string;
    tokenId: string;
    type: 'Create and Mint Token on Chain A' | 'Lock on Chain A and Mint Token on Chain B' | 'Unlock on Chain A and Burn on Chain B';
    status: 'Completed' | 'Failed' | 'Pending';
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