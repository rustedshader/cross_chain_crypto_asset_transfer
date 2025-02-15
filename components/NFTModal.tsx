"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { BrowserProvider, Contract, ethers } from "ethers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Lock, Wallet, AlertCircle } from "lucide-react";
import { decodeError, truncateAddress, getExplorerLink } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";
import { LOCKING_CONTRACT_ABI, MINTING_CONTRACT_ABI } from "@/lib/contracts";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

export interface Transaction {
  id?: string;
  tokenId: string;
  lockHash?: string;
  mintHash?: string;
  burnHash?: string;
  unlockHash?: string;
  timestamp: number;
  sender: string;
  receiver: string;
  type: string;
  status: "Pending" | "Completed" | "Failed";
}

// Assume your Redux store has a wallet slice at state.wallet.
// For TypeScript, you might have a RootState type defined in your store.
interface RootState {
  wallet: {
    address: string;
    balance: number;
    chain: string;
    isConnected: boolean;
  };
}

// ─────────────────────────────────────────────
// NFTDetails Component – displays NFT information
// ─────────────────────────────────────────────

interface NFTDetailsProps {
  nft: NFT;
}

const NFTDetails: React.FC<NFTDetailsProps> = ({ nft }) => {
  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl">
          {nft.name || `NFT #${nft.identifier}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nft.display_image_url ? (
          <img
            src={nft.display_image_url}
            alt={nft.name || `NFT ${nft.identifier}`}
            className="w-full h-64 object-cover rounded-md"
          />
        ) : (
          <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500">No Image Available</span>
          </div>
        )}

        <div className="text-sm space-y-1">
          <p>
            <strong>Collection:</strong> {nft.collection}
          </p>
          <p>
            <strong>Contract:</strong> {nft.contract}
          </p>
          <p>
            <strong>Token Standard:</strong> {nft.token_standard}
          </p>
          <p>
            <strong>Description:</strong> {nft.description || "N/A"}
          </p>
          <p>
            <strong>Metadata URL:</strong>{" "}
            {nft.metadata_url ? (
              <a
                href={nft.metadata_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {nft.metadata_url}
              </a>
            ) : (
              "N/A"
            )}
          </p>
          <p>
            <strong>Updated At:</strong>{" "}
            {new Date(nft.updated_at).toLocaleString()}
          </p>
          <p>
            <strong>Disabled:</strong> {nft.is_disabled ? "Yes" : "No"}
          </p>
          <p>
            <strong>NSFW:</strong> {nft.is_nsfw ? "Yes" : "No"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild>
          <a
            href={nft.opensea_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on OpenSea
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────
// BridgeActions Component – handles lock & mint logic with dropdown
// ─────────────────────────────────────────────

interface BridgeActionsProps {
  nft: NFT;
  addTransaction: (tx: Transaction) => void;
}

const BridgeActions: React.FC<BridgeActionsProps> = ({ nft, addTransaction }) => {
  // Get wallet info from Redux store
  const { address: userAddress } = useSelector(
    (state: RootState) => state.wallet
  );

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [currentChain, setCurrentChain] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<"AMOY" | "CARDONA">(
    "CARDONA"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize provider and current chain info
  useEffect(() => {
    if (window.ethereum) {
      const prov = new BrowserProvider(window.ethereum, "any");
      setProvider(prov);
      (async () => {
        const network = await prov.getNetwork();
        const chainId = "0x" + network.chainId.toString(16);
        setCurrentChain(
          chainId === CONSTANTS.AMOY_CHAIN_ID
            ? "Polygon Amoy"
            : chainId === CONSTANTS.CARDONA_CHAIN_ID
            ? "Polygon zkEVM Cardona Testnet"
            : "Unknown Chain"
        );
      })();

      window.ethereum.on("chainChanged", async () => {
        const network = await prov.getNetwork();
        const chainId = "0x" + network.chainId.toString(16);
        setCurrentChain(
          chainId === CONSTANTS.AMOY_CHAIN_ID
            ? "Polygon Amoy"
            : chainId === CONSTANTS.CARDONA_CHAIN_ID
            ? "Polygon zkEVM Cardona Testnet"
            : "Unknown Chain"
        );
      });
    }
  }, []);

  // Helper: Switch chain using wallet_switchEthereumChain (and add if needed)
  const switchToChain = useCallback(
    async (chainType: "AMOY" | "CARDONA") => {
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

  // Helper: Check token ownership using the ERC721 ownerOf method
  const checkTokenOwnership = useCallback(
    async (contract: Contract, tokenId: string): Promise<boolean> => {
      try {
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === userAddress.toLowerCase();
      } catch {
        return false;
      }
    },
    [userAddress]
  );

  // Helper: Insert a transaction record via API
  const insertTransactionRecord = useCallback(
    async (transactionData: Partial<Transaction>) => {
      try {
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

  // Helper: Fetch Merkle proof (if needed)
  async function fetchMerkleProof(
    tokenId: string,
    userAddress: string
  ): Promise<{ proof: string[]; merkleRoot: string } | null> {
    try {
      const res = await fetch("/api/getMerkleProof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, userAddress }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Error fetching Merkle proof:", err.error);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error("Error in fetchMerkleProof:", err);
      return null;
    }
  }

  // Function: Mint Token on Chain A (Polygon Amoy)
  const mintToken = useCallback(async () => {
    setErrorMessage("");
    if (!nft.identifier || !provider) {
      setErrorMessage("Token id is invalid or provider not available");
      return;
    }
    setIsLoading(true);

    const leaf = ethers.keccak256(
      ethers.toUtf8Bytes(`${nft.identifier}-${userAddress}`)
    );
    const proof: any = await fetchMerkleProof(nft.identifier, userAddress);
    if (!proof) {
      setErrorMessage("Failed to fetch Merkle proof");
      setIsLoading(false);
      return;
    }
    const verifierAddress = "0xYourDeployedMerkleVerifierAddress";
    const pendingRecord = await insertTransactionRecord({
      type: "Create and Mint Token on Chain A",
      tokenId: nft.identifier,
      status: "Pending",
      sender: userAddress,
      receiver: userAddress,
      timestamp: Date.now(),
    });
    try {
      const signer = await provider.getSigner();
      const verifierContract = new Contract(
        verifierAddress,
        [
          "function verifyProof(bytes32[] calldata proof, bytes32 leaf) external view returns (bool)",
        ],
        signer
      );
      const isValid = await verifierContract.verifyProof(proof, leaf);
      if (!isValid) {
        if (pendingRecord?.id)
          await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
        throw new Error("Merkle proof verification failed");
      }
      await switchToChain("AMOY");
      const signerA = await provider.getSigner();
      const lockingContract = new Contract(
        CONSTANTS.LOCKING_CONTRACT,
        LOCKING_CONTRACT_ABI,
        signerA
      );
      const mintTx = await lockingContract.mint(userAddress, nft.identifier, {
        gasLimit: 300000,
      });
      await mintTx.wait();
      addTransaction({
        mintHash: mintTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: nft.identifier,
        type: "Create and Mint Token on Chain A",
        status: "Completed",
      });
      if (pendingRecord?.id)
        await updateTransactionRecord(pendingRecord.id, {
          mintHash: mintTx.hash,
          status: "Completed",
        });
      alert("Token minted successfully on Polygon Amoy!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as Error));
      if (pendingRecord?.id)
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
    } finally {
      setIsLoading(false);
    }
  }, [
    nft.identifier,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    addTransaction,
  ]);

  // Function: Lock on Chain A then Mint on Chain B
  const lockAndMint = useCallback(async () => {
    setErrorMessage("");
    if (!nft.identifier || !provider) {
      setErrorMessage("Token id is invalid or provider not available");
      return;
    }
    setIsLoading(true);
    const pendingRecord = await insertTransactionRecord({
      type: "Lock on Chain A and Mint Token on Chain B",
      tokenId: nft.identifier,
      status: "Pending",
      sender: userAddress,
      receiver: userAddress,
      timestamp: Date.now(),
    });
    try {
      // Step 1: Lock on Chain A
      await switchToChain("AMOY");
      const signerA = await provider.getSigner();
      const lockingContract = new Contract(
        CONSTANTS.LOCKING_CONTRACT,
        LOCKING_CONTRACT_ABI,
        signerA
      );
      const isOwner = await checkTokenOwnership(lockingContract, nft.identifier);
      if (!isOwner) throw new Error("You don't own this token");
      const isLocked = await lockingContract.lockedTokens(nft.identifier);
      if (isLocked) throw new Error("Token is already locked");
      const lockTx = await lockingContract.lockToken(nft.identifier, userAddress, {
        gasLimit: 500000,
      });
      await lockTx.wait();
      // Step 2: Mint on Chain B
      await switchToChain("CARDONA");
      const signerB = await provider.getSigner();
      const mintingContract = new Contract(
        CONSTANTS.MINTING_CONTRACT,
        MINTING_CONTRACT_ABI,
        signerB
      );
      const mintTx = await mintingContract.mintToken(nft.identifier, userAddress, {
        gasLimit: 500000,
      });
      await mintTx.wait();
      addTransaction({
        lockHash: lockTx.hash,
        mintHash: mintTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: nft.identifier,
        type: "Lock on Chain A and Mint Token on Chain B",
        status: "Completed",
      });
      if (pendingRecord?.id)
        await updateTransactionRecord(pendingRecord.id, {
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          status: "Completed",
        });
      alert("Token locked on Amoy and minted on Polygon zkEVM Cardona successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as Error));
      if (pendingRecord?.id)
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
    } finally {
      setIsLoading(false);
    }
  }, [
    nft.identifier,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    checkTokenOwnership,
    addTransaction,
  ]);

  // Handler: call mintToken or lockAndMint based on dropdown selection
  const handleBridge = async () => {
    if (selectedChain === "AMOY") {
      await mintToken();
    } else if (selectedChain === "CARDONA") {
      await lockAndMint();
    }
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
            onChange={(e) =>
              setSelectedChain(e.target.value as "AMOY" | "CARDONA")
            }
            className="p-2 rounded-md bg-gray-700 text-white border border-gray-600"
          >
            <option value="AMOY">Polygon Amoy</option>
            <option value="CARDONA">Polygon zkEVM Cardona Testnet</option>
          </select>
          <Button onClick={handleBridge} disabled={isLoading} className="h-12">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : selectedChain === "AMOY" ? (
              "Mint on Polygon Amoy"
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock and Mint on Cardona
              </>
            )}
          </Button>
        </div>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// TransactionHistory Component – displays recent transactions
// ─────────────────────────────────────────────

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
}) => {
  return (
    <Card className="bg-gray-800 text-white mt-6">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          View your recent cross-chain transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <Card key={index} className="bg-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">{tx.type}</CardTitle>
                <CardDescription>
                  Token ID: {tx.tokenId} • {new Date(tx.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {tx.lockHash && (
                  <a
                    href={getExplorerLink(tx.lockHash, CONSTANTS.AMOY_CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Lock Transaction ↗
                  </a>
                )}
                {tx.mintHash && (
                  <a
                    href={getExplorerLink(
                      tx.mintHash,
                      tx.type.includes("Chain B")
                        ? CONSTANTS.CARDONA_CHAIN_ID
                        : CONSTANTS.AMOY_CHAIN_ID
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Mint Transaction ↗
                  </a>
                )}
                {tx.burnHash && (
                  <a
                    href={getExplorerLink(tx.burnHash, CONSTANTS.CARDONA_CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Burn Transaction ↗
                  </a>
                )}
                {tx.unlockHash && (
                  <a
                    href={getExplorerLink(tx.unlockHash, CONSTANTS.AMOY_CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Unlock Transaction ↗
                  </a>
                )}
              </CardContent>
              <CardFooter>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : tx.status === "Failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {tx.status}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// NFTModal Component – composes the above components into a modal
// ─────────────────────────────────────────────

interface NFTModalProps {
  nft: NFT;
  onClose: () => void;
}

const NFTModal: React.FC<NFTModalProps> = ({ nft, onClose }) => {
  // Keep transaction records in the parent so they can be passed to TransactionHistory
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const addTransaction = (tx: Transaction) => {
    setTransactions((prev) => [...prev, tx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-red-500"
        >
          ✕
        </button>

        {/* NFT Details */}
        <NFTDetails nft={nft} />

        {/* Cross-Chain Bridge Actions */}
        <BridgeActions nft={nft} addTransaction={addTransaction} />

        {/* Transaction History */}
        {transactions.length > 0 && (
          <TransactionHistory transactions={transactions} />
        )}
      </div>
    </div>
  );
};

export default NFTModal;
