import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { BrowserProvider, Contract, ethers } from "ethers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Lock, AlertCircle } from "lucide-react";
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

  const lockAndWrap = useCallback(async () => {
    if (!nft.identifier || !provider || !nft.contract || !nft.opensea_url) {
      toast.error("Invalid NFT data or provider not available", {
        position: "top-right",
      });
      return;
    }

    console.log("NFT---->", nft);
    setIsLoading(true);
    const pendingRecord = await insertTransactionRecord({
      type: "Lock on Chain A and Wrap on Chain B",
      tokenId: nft.identifier,
      status: "Pending",
      sender: userAddress,
      receiver: userAddress,
      timestamp: Date.now(),
    });

    try {
      // Switch to source chain
      await switchToChain(sourceChain);
      const signer = await provider.getSigner();

      // Create NFT contract instance
      const nftContract = new Contract(nft.contract, NFT_CONTRACT_ABI, signer);

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
      const lockingContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[sourceChain].source_contract,
        LOCKING_CONTRACT_ABI,
        signer
      );

      const transferId = ethers.keccak256(
        ethers.toUtf8Bytes(`${userAddress}-${nft.identifier}-${Date.now()}`)
      );

      console.log("Transfer ID:", transferId);
    
      const lockTx = await lockingContract.lockNFT(
        nft.contract,
        nft.identifier,
        transferId,
        { gasLimit: 500000 }
      );
      await lockTx.wait();

      // Switch to destination chain
      toast.info("Switching to destination chain...", { position: "top-right" });
      await switchToChain(selectedChain);
      const signerDest = await provider.getSigner();

      // Mint wrapped NFT
      toast.info("Minting wrapped NFT...", { position: "top-right" });
      const destinationContract = new Contract(
        CONSTANTS.CHAIN_CONFIG[selectedChain].destination_contract,
        MINTING_CONTRACT_ABI,
        signerDest
      );

      const mintTx = await destinationContract.mintWrappedNFT(
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
      
      if (pendingRecord?.id) {
        await updateTransactionRecord(pendingRecord.id, {
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          status: "Completed",
        });
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

  const handleBridge = async () => {
    await lockAndWrap();
  };

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
            onClick={handleBridge} 
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