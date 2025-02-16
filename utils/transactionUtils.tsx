import { Transaction } from '@/types';
import { useCallback } from 'react';

export function useTransactionOperations() {
  // Helper: Insert a transaction record via API
  const insertTransactionRecord = useCallback(
    async (transactionData: Partial<Transaction>) => {
      try {
        console.log("transactionData", transactionData);
        const res = await fetch("/api/transactions/insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionData),
        });
        const data = await res.json();
        return data.transaction;
      } catch (err) {
        console.error("Failed to insert transaction record:", err);
        return null;
      }
    },
    []
  );

  // Helper: Update a transaction record via API
  const updateTransactionRecord = useCallback(
    async (id: string, transactionData: Partial<Transaction>) => {
      try {
        await fetch("/api/transactions/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...transactionData }),
        });
      } catch (err) {
        console.error("Failed to update transaction record:", err);
      }
    },
    []
  );

    // // Helper: Check token ownership using the ERC721 ownerOf method
    // const checkTokenOwnership = useCallback(
    //   async (contract: Contract, tokenId: string): Promise<boolean> => {
    //     try {
    //       const owner = await contract.ownerOf(tokenId);
    //       return owner.toLowerCase() === userAddress.toLowerCase();
    //     } catch {
    //       return false;
    //     }
    //   },
    //   [userAddress]
    // );


  return { insertTransactionRecord, updateTransactionRecord };
}
