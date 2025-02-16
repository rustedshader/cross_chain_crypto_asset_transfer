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
import { ArrowRightLeft, Lock, Unlock,Loader2  } from "lucide-react";
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
import { WrappedNFTInfo } from "@/utils/nftUtils";
import { createClient } from "@/utils/supabase/client";
import { isAction } from "redux";

interface BridgeActionsProps {
  nft: NFT;
  wrappedInfo?: WrappedNFTInfo;
  addTransaction: (tx: Transaction) => void;
  sourceChain: keyof typeof CONSTANTS.CHAIN_CONFIG;
}

const BridgeActions: React.FC<BridgeActionsProps> = ({
  nft,
  wrappedInfo,
  addTransaction,
  sourceChain,
}) => {
  const { address: userAddress } = useSelector(
    (state: RootState) => state.wallet
  );

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [selectedChain, setSelectedChain] = useState<keyof typeof CONSTANTS.CHAIN_CONFIG>("BASE_SEPOLIA");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);

  const { insertTransactionRecord, updateTransactionRecord } = useTransactionOperations();
  const supabase = createClient();
  const dispatch = useAppDispatch();
  //set user using supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
        return;
      }
      setUser(user.user);
    };
    getUser();
  }, [supabase]);

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

  const merkleCheck = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/merkle_check?email=${email}`, {
        method: "GET",
      });
      const data = await response.json();
      return data.isVerified; // Assuming the API returns { isValid: boolean }
    } catch (error) {
      console.error("Error during Merkle check:", error);
      return false;
    }
  };

  const verifyTransferState = async (
    lockingContract: Contract,
    mintingContract: Contract,
    transferId: string
  ) => {
    try {
      return true;
      // Check source chain
      const sourceProcessed = await lockingContract.checkProcessedTransfer(transferId);
      
      // Check destination chain
      const destProcessed = await mintingContract.processedTransfers(transferId);

      if (sourceProcessed || destProcessed) {
        throw new Error("Transfer ID already processed");
      }
      return true;
    } catch (error) {
      console.error('Error in verifyTransferState:', error);
      throw error;
    }
  };

  const lockAndWrap = useCallback(async () => {
    if (!nft.identifier || !provider || !nft.contract || !nft.opensea_url) {
      toast.error("Invalid NFT data or provider not available");
      return;
    }

    setIsLoading(true);
    
    let transferId: string | null = null;
    
    const pendingRecord = await insertTransactionRecord({
      userId: user?.id,
      type: "LOCK_AND_MINT",
      tokenId: nft.identifier,
      transferId: "",
      sourceChain: sourceChain,
      targetChain: selectedChain,
      sourceContract: CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
      targetContract: CONSTANTS.CHAIN_CONFIG[selectedChain].destination_contract,
      status: "Pending",
      isActive: true
    });

    const isAllowed = await merkleCheck(user.email);
    if (!isAllowed) {
      setErrorMessage("You are not authorized to mint tokens.");
      setIsLoading(false);
      return;
    }

    try {
      transferId = ethers.keccak256(
        ethers.toUtf8Bytes(`${userAddress}-${nft.identifier}-${Date.now()}`)
      );

      // Update pending record with transferId
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, {
          transferId: transferId
        });
      }

      // Initialize contracts and verify states
      await switchToChain(sourceChain);
      const sourceSigner = await provider.getSigner();
      
      const lockingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        LOCKING_CONTRACT_ABI,
        sourceSigner
      );

      await switchToChain(selectedChain);
      const destSigner = await provider.getSigner();
      const mintingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[selectedChain].destination_contract,
        MINTING_CONTRACT_ABI,
        destSigner
      );

      // Verify transfer state
      await verifyTransferState(lockingContract, mintingContract, transferId);

      // Lock NFT
      await switchToChain(sourceChain);
      const nftContract = new Contract(nft.contract, NFT_CONTRACT_ABI, sourceSigner);

      // Verify ownership
      const owner = await nftContract.ownerOf(nft.identifier);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error("You don't own this NFT");
      }

      // Approve transfer
      toast.info("Approving NFT transfer...");
      const approveTx = await nftContract.approve(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        nft.identifier,
        { gasLimit: 500000 }
      );
      await approveTx.wait();

      // Lock NFT
      toast.info("Locking NFT on source chain...");
      const lockTx = await lockingContract.lockNFT(
        nft.contract,
        nft.identifier,
        transferId,
        { gasLimit: 500000 }
      );
      await lockTx.wait();

      // // Verify lock success
      // const isLocked = await lockingContract.checkProcessedTransfer(transferId);
      // if (!isLocked) {
      //   throw new Error("Lock transaction failed verification");
      // }

      // Mint wrapped NFT
      toast.info("Switching to destination chain...");
      await switchToChain(selectedChain);
      
      toast.info("Minting wrapped NFT...");
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

        // Record successful transaction
        const txDetails = {
          userId: user?.id,
          transferId: transferId,
          sourceChain: sourceChain,
          targetChain: selectedChain,
          sourceContract: nft.contract,
          targetContract: mintTx.hash,
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          timestamp: Date.now(),
          sender: userAddress,
          receiver: userAddress,
          tokenId: nft.identifier,
          type: "LOCK_AND_MINT",
          status: "Completed",
          isActive: true,
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

        toast.success("NFT successfully bridged!");
      } catch (mintError) {
        console.error("Minting error:", mintError);
        // If minting fails, unlock the NFT
        toast.error("Minting failed, unlocking NFT...");
        await switchToChain(sourceChain);
        const unlockTx = await lockingContract.unlockNFT(transferId, {
          gasLimit: 500000
        });
        await unlockTx.wait();
        // throw new Error("Minting failed, NFT has been unlocked");
      }

    } catch (error) {
      console.error("Error:", error);
      const errorMessage = decodeError(error as ContractError);
      toast.error(errorMessage);
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, { 
          status: "Failed",
          isActive: false
        });
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
    user,
    dispatch
  ]);

  const burnAndUnlock = useCallback(async () => {
    if (!wrappedInfo || !provider || !nft.identifier) {
      toast.error("Invalid NFT data or not a wrapped token");
      return;
    }

    setIsLoading(true);
    const pendingRecord = await insertTransactionRecord({
      userId: user?.id,
      type: "BURN_AND_UNLOCK",
      tokenId: nft.identifier,
      transferId: wrappedInfo.transferId!,
      sourceChain: wrappedInfo.originalChain!,
      targetChain: sourceChain,
      sourceContract: wrappedInfo.originalContract!,
      targetContract: nft.contract,
      status: "Pending",
      isActive: false
    });

    const isAllowed = await merkleCheck(user.email);
    if (!isAllowed) {
      setErrorMessage("You are not authorized to mint tokens.");
      setIsLoading(false);
      return;
    }

    try {
      // Burn wrapped NFT
      await switchToChain(sourceChain);
      const signer = await provider.getSigner();
      const mintingContract = new Contract(
        nft.contract,
        MINTING_CONTRACT_ABI,
        signer
      );

      const transferId = ethers.keccak256(
        ethers.toUtf8Bytes(`${userAddress}-${nft.identifier}-${Date.now()}`)
      );

      console.log(wrappedInfo);

      toast.info("Burning wrapped NFT...");
      const burnTx = await mintingContract.burnWrappedNFT(
        nft.identifier,
        transferId,
        { gasLimit: 500000 }
      );
      await burnTx.wait();

      // Unlock original NFT
      await switchToChain(wrappedInfo.originalChain as keyof typeof CONSTANTS.CHAIN_CONFIG);
      const originalSigner = await provider.getSigner();
      const lockingContract = new Contract(
        wrappedInfo.originalContract!,
        LOCKING_CONTRACT_ABI,
        originalSigner
      );

      if (!wrappedInfo.transferId) {
        throw new Error("Transfer ID is missing");
      }



      toast.info("Unlocking original NFT...");
      const unlockTx = await lockingContract.unlockNFT(
        wrappedInfo.transferId,
        { gasLimit: 500000 }
      );
      await unlockTx.wait();

      // Update transaction records
      const txDetails = {
        userId: user?.id,
        transferId: wrappedInfo.transferId!,
        sourceChain: wrappedInfo.originalChain!,
        targetChain: sourceChain,
        sourceContract: wrappedInfo.originalContract!,
        targetContract: nft.contract,

        burnHash: burnTx.hash,
        unlockHash: unlockTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: nft.identifier,
        type: "BURN_AND_UNLOCK",
        status: "Completed",
        isActive: false
      };

      addTransaction(txDetails);

      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, {
          burnHash: burnTx.hash,
          unlockHash: unlockTx.hash,
          status: "Completed"
        });
      }

      // Update the original bridge transaction
      if (wrappedInfo.transaction?.id) {
        await updateTransactionRecord(wrappedInfo.transaction.id, {
          isActive: false
        });
      }

      toast.success("NFT successfully returned to original chain!");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = decodeError(error as ContractError);
      toast.error(errorMessage);
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, { 
          status: "Failed",
          isActive: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    nft,
    wrappedInfo,
    provider,
    userAddress,
    sourceChain,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    addTransaction,
    user,
  ]);

  return (
    <Card className="bg-gray-800 text-white mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6" />
          Cross-Chain Bridge
        </CardTitle>
        <CardDescription>
          {wrappedInfo?.isWrapped 
            ? "Return this NFT to its original chain"
            : "Transfer this NFT to a different chain"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {wrappedInfo?.isWrapped ? (
          <Button 
            onClick={burnAndUnlock} 
            disabled={isLoading} 
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Returning to Original Chain...
              </div>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Return to Original Chain ({wrappedInfo.originalChain})
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as keyof typeof CONSTANTS.CHAIN_CONFIG)}
              className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
              disabled={isLoading}
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
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bridging NFT...
                </div>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Bridge NFT
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BridgeActions;

function setErrorMessage(arg0: string) {
  throw new Error("Function not implemented.");
}
