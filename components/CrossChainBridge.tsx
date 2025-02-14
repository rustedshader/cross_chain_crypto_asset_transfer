"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import {
  AlertCircle,
  Wallet,
  ArrowRightLeft,
  Lock,
  Unlock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CONSTANTS } from "@/lib/constants";
import { LOCKING_CONTRACT_ABI, MINTING_CONTRACT_ABI } from "@/lib/contracts";
import { decodeError, truncateAddress, getExplorerLink } from "@/lib/utils";
import { Transaction, ContractError } from "@/types";
import {verifyOnChainMerkleProof} from "@/utils/merkelUtils";
import { ethers } from 'ethers';

export default function CrossChainBridge() {
  const [userAddress, setUserAddress] = useState<string>("");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokenId, setTokenId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentChain, setCurrentChain] = useState<string>("");

  // Update current chain information using the provider.
  const updateChain = useCallback(async () => {
    if (provider) {
      const network = await provider.getNetwork();
      const chainId = "0x" + network.chainId.toString(16);
      setCurrentChain(
        chainId === CONSTANTS.AMOY_CHAIN_ID
          ? "Polygon Amoy"
          : chainId === CONSTANTS.CARDONA_CHAIN_ID
          ? "Polygon zkEVM Cardona Testnet"
          : "Unknown Chain"
      );
    }
  }, [provider]);

  useEffect(() => {
    updateChain();
    window.ethereum?.on("chainChanged", updateChain);
    return () => {
      window.ethereum?.removeListener("chainChanged", updateChain);
    };
  }, [updateChain]);

  // Helper: Switch chain using wallet_switchEthereumChain (and add if needed).
  const switchToChain = useCallback(async (chainType: "AMOY" | "CARDONA") => {
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
  }, []);

    // Connect wallet using wallet_request
    const connectWallet = useCallback(async () => {
    setErrorMessage("");
    if (typeof window === "undefined" || !window.ethereum) {
      setErrorMessage("Please install MetaMask!");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setUserAddress(address);
      setProvider(provider);

      // Switch to Amoy chain by default.
      await switchToChain("AMOY");

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          updateChain();
        } else {
          setUserAddress("");
        }
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setErrorMessage(`Failed to connect wallet: ${(error as Error).message}`);
    }
  }, [switchToChain, updateChain]);

  // Check token ownership using the ERC721 ownerOf method.
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

  // Insert a transaction record via API.
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

  // Update a transaction record via API.
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

  // Create & Mint token on Chain A.
  const mintToken = useCallback(async () => {
    setErrorMessage("");
    if (!tokenId || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);

    // Assume you compute a leaf hash (e.g. keccak256 hash of tokenId + userAddress)
    const leaf = ethers.keccak256(ethers.toUtf8Bytes(`${tokenId}-${userAddress}`));
    // Assume you obtain the proof array from your backend or off-chain process
    const proof:any[] = [/* array of hex string values */];
    const verifierAddress = '0xYourDeployedMerkleVerifierAddress';

    const pendingRecord = await insertTransactionRecord({
      type: "Create and Mint Token on Chain A",
      tokenId,
      status: "Pending",
    });
    try {
        // Verify the merkle proof on-chain
        const isValid = await verifyOnChainMerkleProof(proof, leaf, verifierAddress);
        if (!isValid) {
        throw new Error('Merkle proof verification failed');
        }

      await switchToChain("AMOY");
      const signer = await provider.getSigner();
      const lockingContract = new Contract(
        CONSTANTS.LOCKING_CONTRACT,
        LOCKING_CONTRACT_ABI,
        signer
      );
      const mintTx = await lockingContract.mint(userAddress, tokenId, {
        gasLimit: 300000,
      });
      await mintTx.wait();
      setTransactions((prev) => [
        ...prev,
        {
          mintHash: mintTx.hash,
          timestamp: Date.now(),
          sender: userAddress,
          receiver: userAddress,
          tokenId,
          type: "Create and Mint Token on Chain A",
          status: "Completed",
        },
      ]);
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, {
          mintHash: mintTx.hash,
          status: "Completed",
        });
      }
      alert("Token minted successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenId,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
  ]);

  // Lock token on Chain A then mint on Chain B.
  const lockAndMint = useCallback(async () => {
    setErrorMessage("");
    if (!tokenId || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);
    const pendingRecord = await insertTransactionRecord({
      type: "Lock on Chain A and Mint Token on Chain B",
      tokenId,
      status: "Pending",
    });
    try {
      // Step 1: Lock on Chain A.
      await switchToChain("AMOY");
      const signerA = await provider.getSigner();
      const lockingContract = new Contract(
        CONSTANTS.LOCKING_CONTRACT,
        LOCKING_CONTRACT_ABI,
        signerA
      );
      const isOwner = await checkTokenOwnership(lockingContract, tokenId);
      if (!isOwner) throw new Error("You don't own this token");
      const isLocked = await lockingContract.lockedTokens(tokenId);
      if (isLocked) throw new Error("Token is already locked");
      const lockTx = await lockingContract.lockToken(tokenId, userAddress, {
        gasLimit: 500000,
      });
      await lockTx.wait();
      // Step 2: Mint on Chain B.
      await switchToChain("CARDONA");
      const signerB = await provider.getSigner();
      const mintingContract = new Contract(
        CONSTANTS.MINTING_CONTRACT,
        MINTING_CONTRACT_ABI,
        signerB
      );
      const mintTx = await mintingContract.mintToken(tokenId, userAddress, {
        gasLimit: 500000,
      });
      await mintTx.wait();
      setTransactions((prev) => [
        ...prev,
        {
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          timestamp: Date.now(),
          sender: userAddress,
          receiver: userAddress,
          tokenId,
          type: "Lock on Chain A and Mint Token on Chain B",
          status: "Completed",
        },
      ]);
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, {
          lockHash: lockTx.hash,
          mintHash: mintTx.hash,
          status: "Completed",
        });
      }
      alert("Token locked and minted successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenId,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
    checkTokenOwnership,
  ]);

  // Burn token on Chain B then unlock on Chain A.
  const unlockAndBurn = useCallback(async () => {
    setErrorMessage("");
    if (!tokenId || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);
    const pendingRecord = await insertTransactionRecord({
      type: "Unlock on Chain A and Burn on Chain B",
      tokenId,
      status: "Pending",
    });
    try {
      // Step 1: Burn on Chain B.
      await switchToChain("CARDONA");
      const signerB = await provider.getSigner();
      const mintingContract = new Contract(
        CONSTANTS.MINTING_CONTRACT,
        MINTING_CONTRACT_ABI,
        signerB
      );
      const burnTx = await mintingContract.burnToken(tokenId, {
        gasLimit: 300000,
      });
      await burnTx.wait();
      // Step 2: Unlock on Chain A.
      await switchToChain("AMOY");
      const signerA = await provider.getSigner();
      const lockingContract = new Contract(
        CONSTANTS.LOCKING_CONTRACT,
        LOCKING_CONTRACT_ABI,
        signerA
      );
      const unlockTx = await lockingContract.unlockToken(tokenId, {
        gasLimit: 300000,
      });
      await unlockTx.wait();
      setTransactions((prev) => [
        ...prev,
        {
          burnHash: burnTx.hash,
          unlockHash: unlockTx.hash,
          timestamp: Date.now(),
          sender: userAddress,
          receiver: userAddress,
          tokenId,
          type: "Unlock on Chain A and Burn on Chain B",
          status: "Completed",
        },
      ]);
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, {
          burnHash: burnTx.hash,
          unlockHash: unlockTx.hash,
          status: "Completed",
        });
      }
      alert("Token burned and unlocked successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
      if (pendingRecord) {
        await updateTransactionRecord(pendingRecord.id, { status: "Failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenId,
    provider,
    userAddress,
    insertTransactionRecord,
    updateTransactionRecord,
    switchToChain,
  ]);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ArrowRightLeft className="h-8 w-8" />
              Cross-Chain Bridge
            </CardTitle>
            <CardDescription>
              Transfer tokens between Polygon Amoy and zkEVM Cardona
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!userAddress ? (
              <div className="space-y-4 text-center py-8">
                <Wallet className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="text-lg font-medium">Connect Your Wallet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Please connect your wallet to continue
                </p>
                <Button size="lg" onClick={connectWallet} className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Connected Wallet</AlertTitle>
                    <AlertDescription>
                      {truncateAddress(userAddress)}
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTitle>Current Chain</AlertTitle>
                    <AlertDescription>{currentChain}</AlertDescription>
                  </Alert>
                </div>

                <div className="grid gap-4">
                  <Input
                    type="number"
                    placeholder="Enter Token ID"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="flex-1"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="secondary"
                      onClick={mintToken}
                      disabled={isLoading}
                      className="h-20"
                    >
                      {isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <>
                          Create and Mint Token
                          <br />
                          on Chain A
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={lockAndMint}
                      disabled={isLoading}
                      className="h-20"
                    >
                      {isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Lock on Chain A &amp;
                          <br />
                          Mint on Chain B
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={unlockAndBurn}
                      disabled={isLoading}
                      className="h-20"
                    >
                      {isLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          Unlock on Chain A &amp;
                          <br />
                          Burn on Chain B
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {userAddress && transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your recent bridge transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{tx.type}</CardTitle>
                      <CardDescription>
                        Token ID: {tx.tokenId} •{" "}
                        {new Date(tx.timestamp).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                      {tx.lockHash && (
                        <a
                          href={getExplorerLink(
                            tx.lockHash,
                            CONSTANTS.AMOY_CHAIN_ID
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
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
                          className="text-blue-500 hover:underline"
                        >
                          Mint Transaction ↗
                        </a>
                      )}
                      {tx.burnHash && (
                        <a
                          href={getExplorerLink(
                            tx.burnHash,
                            CONSTANTS.CARDONA_CHAIN_ID
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Burn Transaction ↗
                        </a>
                      )}
                      {tx.unlockHash && (
                        <a
                          href={getExplorerLink(
                            tx.unlockHash,
                            CONSTANTS.AMOY_CHAIN_ID
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
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
        )}
      </div>
    </div>
  );
}
