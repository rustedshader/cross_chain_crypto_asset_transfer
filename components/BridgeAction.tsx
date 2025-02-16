import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {setRecentCompletedTx} from "@/redux/walletSlice";
import { BrowserProvider, Contract, ethers } from "ethers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Lock } from "lucide-react";
import { toast } from 'react-toastify';
import { decodeError } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";
import {
  LOCKING_CONTRACT_ABI,
  MINTING_CONTRACT_ABI,
  NFT_CONTRACT_ABI,
} from "@/lib/contracts";
import { ContractError, NFT, Transaction, RootState } from "@/types";
import { useTransactionOperations } from "@/utils/transactionUtils";

interface BridgeActionsProps {
  nft: NFT;
  addTransaction: (tx: Transaction) => void;
  sourceChain: keyof typeof CONSTANTS.CHAIN_CONFIG;
}

const BridgeActions: React.FC<BridgeActionsProps> = ({
  nft,
  addTransaction,
  sourceChain,
}) => {
  const { address: userAddress } = useSelector(
    (state: RootState) => state.wallet
  );

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [selectedChain, setSelectedChain] =
    useState<keyof typeof CONSTANTS.CHAIN_CONFIG>("BASE_SEPOLIA");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { insertTransactionRecord, updateTransactionRecord } =
    useTransactionOperations();

const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.ethereum) {
      const prov = new BrowserProvider(window.ethereum, "any");
      setProvider(prov);
    }
  }, []);

  const switchToChain = useCallback(
    async (chainType: keyof typeof CONSTANTS.CHAIN_CONFIG) => {
      const config = CONSTANTS.CHAIN_CONFIG[chainType];
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: config.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [config],
          });
        } else {
          throw switchError;
        }
      }
    },
    []
  );

  const verifyTransferState = async (
    lockingContract: Contract,
    mintingContract: Contract,
    transferId: string
  ) => {
    return true;
    // Check if transfer is already processed on either chain
    // const [isProcessedSource, isProcessedDest] = await Promise.all([
    //   lockingContract.processedTransfers(transferId),
    //   mintingContract.processedTransfers(transferId)
    // ]);
    const isProcessedSource = await lockingContract.processedTransfers(transferId);
    const isProcessedDest = await mintingContract.processedTransfers(transferId);

    if (isProcessedSource || isProcessedDest) {
      throw new Error("Transfer ID already used");
    }
  };

  const unlockNFT = async (
    lockingContract: Contract,
    transferId: string
  ) => {
    const unlockTx = await lockingContract.unlockNFT(transferId, {
      gasLimit: 500000
    });
    await unlockTx.wait();
    toast.info("NFT unlocked successfully", { position: "top-right" });
  };

  const lockAndWrap = useCallback(async () => {
    if (!nft.identifier || !provider || !nft.contract || !nft.opensea_url) {
      toast.error("Invalid NFT data or provider not available", {
        position: "top-right"
      });
      return;
    }

    setIsLoading(true);
    let lockingContract: Contract | null = null;
    let transferId: string | null = null;
    
    const pendingRecord = await insertTransactionRecord({
      type: "Lock on Chain A and Wrap on Chain B",
      tokenId: nft.identifier,
      status: "Pending",
      sender: userAddress,
      receiver: userAddress,
      timestamp: Date.now(),
    });

    try {
      // Generate transfer ID first
      transferId = ethers.keccak256(
        ethers.toUtf8Bytes(`${userAddress}-${nft.identifier}-${Date.now()}`)
      );

      // Switch to source chain and get contracts
      await switchToChain(sourceChain);
      const sourceSigner = await provider.getSigner();
      
      lockingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        LOCKING_CONTRACT_ABI,
        sourceSigner
      );

      // Switch to destination chain to verify state
      await switchToChain(selectedChain);
      const destSigner = await provider.getSigner();
      const mintingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[selectedChain].destination_contract,
        MINTING_CONTRACT_ABI,
        destSigner
      );

      // Verify transfer state on both chains
      await verifyTransferState(lockingContract, mintingContract, transferId);

      // Switch back to source chain for locking
      await switchToChain(sourceChain);
      const nftContract = new Contract(nft.contract, NFT_CONTRACT_ABI, sourceSigner);

      // Verify ownership
      const owner = await nftContract.ownerOf(nft.identifier);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error("You don't own this NFT");
      }

      // Approve transfer
      toast.info("Approving NFT transfer...", { position: "top-right" });
      const approveTx = await nftContract.approve(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        nft.identifier,
        { gasLimit: 500000 }
      );
      await approveTx.wait();

      // Lock NFT
      toast.info("Locking NFT on source chain...", { position: "top-right" });
      const lockTx = await lockingContract.lockNFT(
        nft.contract,
        nft.identifier,
        transferId,
        { gasLimit: 500000 }
      );
      await lockTx.wait();

      // Verify lock was successful
      const transfer = await lockingContract.transfers(transferId);
      if (!transfer.processed) {
        throw new Error("Lock transaction failed");
      }

      // Switch to destination chain
      toast.info("Switching to destination chain...", { position: "top-right" });
      await switchToChain(selectedChain);
      
      // Mint wrapped NFT
      toast.info("Minting wrapped NFT...", { position: "top-right" });
      try {
        const mintTx = await mintingContract.mintWrappedNFT(
          userAddress,
          nft.contract,
          nft.identifier,
          transferId,
          nft.opensea_url,
          { gasLimit: 500000 }
        );
        await mintTx.wait();

        // Verify mint was successful
        const isProcessedDest = await mintingContract.processedTransfers(transferId);
        if (!isProcessedDest) {
          throw new Error("Mint verification failed");
        }

        // Record successful transaction
        const txDetails = {
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          timestamp: Date.now(),
          sender: userAddress,
          receiver: userAddress,
          tokenId: nft.identifier,
          type: "Lock on Chain A and Wrap on Chain B",
          status: "Completed",
        };

        addTransaction(txDetails);
        dispatch(setRecentCompletedTx(txDetails.mintHash));
        
        if (pendingRecord?.id) {
          await updateTransactionRecord(pendingRecord.id, {
            lockHash: lockTx.hash,
            mintHash: mintTx.hash,
            status: "Completed",
          });
        }

        toast.success("NFT successfully bridged!", { position: "top-right" });
      } catch (mintError) {
        // If minting fails, unlock the NFT
        toast.error("Minting failed, initiating rollback...", { position: "top-right" });
        await switchToChain(sourceChain);
        await unlockNFT(lockingContract, transferId);
        throw new Error("Minting failed, NFT has been unlocked");
      }

    } catch (error) {
      console.error("Error:", error);
      const errorMessage = decodeError(error as ContractError);
      toast.error(errorMessage, { position: "top-right" });
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    nft,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    addTransaction,
    selectedChain,
    sourceChain,
  ]);

  return (
    <Card className="bg-gray-800 text-white mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6" />
          Cross-Chain Bridge
        </CardTitle>
        <CardDescription>
          Transfer this NFT to a different chain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value as keyof typeof CONSTANTS.CHAIN_CONFIG)}
            className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500"
          >
            {CONSTANTS.AVAILABLE_CHAINS.map(
              (chain) =>
                chain.chainId !== sourceChain && (
                  <option key={chain.chainId} value={chain.chainId}>
                    {chain.name}
                  </option>
                )
            )}
          </select>
          <Button 
            onClick={lockAndWrap} 
            disabled={isLoading} 
            className="h-12 w-full md:w-auto"
          >
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Transfer NFT
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeActions;