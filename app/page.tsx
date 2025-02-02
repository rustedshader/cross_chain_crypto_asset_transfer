'use client';
import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { AlertCircle, Wallet, ArrowRightLeft, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Transaction {
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

interface ContractError extends Error {
  data?: {
    data?: string;
    reason?: string;
  },
  reason?: string;
}

const lockingContractABI = [
  "function mint(address to, uint256 tokenId) external",
  "function lockToken(uint256 tokenId, address receiver) external",
  "function unlockToken(uint256 tokenId) external",
  "function lockedTokens(uint256) public view returns (bool)",
  "function ownerOf(uint256) public view returns (address)",
  "event TokenLocked(uint256 indexed tokenId, address indexed sender, address indexed receiver, uint256 timestamp)",
  "event TokenMinted(uint256 indexed tokenId, address indexed receiver, uint256 timestamp)"
];

const mintingContractABI = [
  "function mintToken(uint256 tokenId, address receiver) external",
  "function burnToken(uint256 tokenId) external",
  "function mintedTokens(uint256) public view returns (bool)",
  "event TokenMinted(uint256 indexed tokenId, address indexed receiver, uint256 timestamp)"
];

export default function Home() {
  const [userAddress, setUserAddress] = useState<string>("");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokenId, setTokenId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const LOCKING_CONTRACT: string = "0x6a9838d3840caa43461a4b1ae273f19cecf4747c";
  const MINTING_CONTRACT: string = "0x348bac76cfffc8fba629b399f51a81b663f80a8a";
  const AMOY_CHAIN_ID: string = "0x13882"; 
  const AMOY_RPC_URL: string = "https://rpc-amoy.polygon.technology";
  const CONTACT_URL: string = "https://amoy.polygonscan.com/"
  const AMOY_SYMBOL: string = "POL";
  const AMOY_NAME: string = "Amoy";
  const CHAIN_NAME: string = "Polygon Amoy";

  const decodeError = (error: ContractError): string => {
    if (error.data) {
      try {
        const errorReason = error.reason;
        if (errorReason === "Token already minted") {
          return "Token already minted";
        }
        if (errorReason === "rejected") {
          return "Transaction rejected";
        }
        if (errorReason === "Insufficient balance to mint") {
          return "Insufficient balance to mint";
        }
      } catch (e) {
        console.error("Error decoding:", e);
      }
    }

    // Handle MetaMask specific errors
    if (error.message?.includes("user denied") || error.message?.includes("User rejected")) {
      return "Transaction was rejected by user";
    }
    if (error.message?.includes("insufficient funds")) {
      return "Insufficient funds for transaction";
    }
    if (error.message?.includes("nonce")) {
      return "Transaction nonce error. Please reset your MetaMask account";
    }

    return error.message || "Unknown error occurred";
  };

  const connectWallet = async () => {
    setErrorMessage("");
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();

        if (chainId !== AMOY_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: AMOY_CHAIN_ID }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: AMOY_CHAIN_ID,
                  chainName: CHAIN_NAME,
                  nativeCurrency: {
                    name: AMOY_NAME,
                    symbol: AMOY_SYMBOL,
                    decimals: 18,
                  },
                  rpcUrls: [AMOY_RPC_URL],
                  blockExplorerUrls: [CONTACT_URL],
                }],
              });
            } else {
              throw switchError;
            }
          }
        }

        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setUserAddress(address);
        setProvider(provider);

        window.ethereum.on('chainChanged', (chainId: string) => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setErrorMessage(`Failed to connect wallet: ${(error as Error).message}`);
      }
    } else {
      setErrorMessage("Please install MetaMask!");
    }
  };

  const checkTokenOwnership = async (contract: Contract, tokenId: string): Promise<boolean> => {
    try {
      const owner = await contract.ownerOf(tokenId);
      console.log("Owner:", owner);
      if (!owner) return false;
      return owner.toLowerCase() === userAddress.toLowerCase();
    } catch (error) {
      console.error("Error checking token ownership:", "You don't own this token");
      return false;
    }
  };

  const mintToken = async () => {
    setErrorMessage("");
    if (!tokenId || isNaN(Number(tokenId)) || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);

    try {
      const signer = await provider.getSigner();
      const lockingContract = new Contract(LOCKING_CONTRACT, lockingContractABI, signer);

      console.log("Minting token...");
      const mintTx = await lockingContract.mint(userAddress, tokenId);
      await mintTx.wait();
      console.log("Token minted successfully");

      const receipt: Transaction = {
        mintHash: mintTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: tokenId,
        type: 'Create and Mint Token on Chain A',
        status: 'Completed'
      };

      setTransactions(prev => [...prev, receipt]);
      alert("Token minted successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
    } finally {
      setIsLoading(false);
    }
  };

  const lockAndMint = async () => {
    setErrorMessage("");
    if (!tokenId || isNaN(Number(tokenId)) || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);

    try {
      const signer = await provider.getSigner();
      const lockingContract = new Contract(LOCKING_CONTRACT, lockingContractABI, signer);
      const mintingContract = new Contract(MINTING_CONTRACT, mintingContractABI, signer);

      const isOwner = await checkTokenOwnership(lockingContract, tokenId);
      console.log(isOwner);
      if (!isOwner) {
        throw new Error("You don't own this token");
      }

      const isLocked = await lockingContract.lockedTokens(tokenId);
      if (isLocked) {
        throw new Error("Token is already locked");
      }
      console.log("Locking token...");
      const lockTx = await lockingContract.lockToken(tokenId, userAddress);
      await lockTx.wait();
      console.log("Token locked successfully");
      console.log("Minting token...");
      const mintTx = await mintingContract.mintToken(tokenId, userAddress);
      await mintTx.wait();
      console.log("Token minted successfully");
      const receipt: Transaction = {
        lockHash: lockTx.hash,
        mintHash: mintTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: tokenId,
        type: 'Lock on Chain A and Mint Token on Chain B',
        status: 'Completed'
      };
      setTransactions(prev => [...prev, receipt]);
      alert("Token locked and minted successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
    } finally {
      setIsLoading(false);
    }
  };

  const unlockAndBurn = async () => {
    setErrorMessage("");
    if (!tokenId || isNaN(Number(tokenId)) || !provider) {
      setErrorMessage("Please enter a valid token ID and connect your wallet");
      return;
    }
    setIsLoading(true);

    try {
      const signer = await provider.getSigner();
      const lockingContract = new Contract(LOCKING_CONTRACT, lockingContractABI, signer);
      const mintingContract = new Contract(MINTING_CONTRACT, mintingContractABI, signer);

      const isLocked = await lockingContract.lockedTokens(tokenId);
      if (!isLocked) {
        throw new Error("Token is not locked");
      }

      const isMinted = await mintingContract.mintedTokens(tokenId);
      if (!isMinted) {
        throw new Error("Token is not minted on Chain B");
      }

      console.log("Burning token...");
      const burnTx = await mintingContract.burnToken(tokenId);
      await burnTx.wait();
      console.log("Token burned successfully");

      console.log("Unlocking token...");
      const unlockTx = await lockingContract.unlockToken(tokenId);
      await unlockTx.wait();
      console.log("Token unlocked successfully");

      const receipt: Transaction = {
        burnHash: burnTx.hash,
        unlockHash: unlockTx.hash,
        timestamp: Date.now(),
        sender: userAddress,
        receiver: userAddress,
        tokenId: tokenId,
        type: 'Unlock on Chain A and Burn on Chain B',
        status: 'Completed'
      };

      setTransactions(prev => [...prev, receipt]);
      alert("Token burned and unlocked successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(decodeError(error as ContractError));
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionExplorerLink = (hash: string) => {
    return `${CONTACT_URL}/tx/${hash}`;
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ArrowRightLeft className="h-8 w-8" />
              Cross-Chain Bridge
            </CardTitle>
            <CardDescription>
              Transfer tokens securely between Chain A and Chain B
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!userAddress ? (
              <div className="space-y-4 text-center py-8">
                <Wallet className="h-16 w-16 mx-auto" />
                <h3 className="text-lg font-medium">Connect Your Wallet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Please make sure you have MetaMask installed and connect your wallet to continue
                </p>
                <Button 
                  size="lg"
                  onClick={connectWallet}
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>Connected Wallet</AlertTitle>
                  <AlertDescription>
                    {truncateAddress(userAddress)}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      placeholder="Enter Token ID"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      className="flex-1"
                    />
                  </div>

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
                          Lock on Chain A &
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
                          Unlock on Chain A &
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
                {transactions.map((tx) => (
                  <Card key={tx.timestamp}>
                    <CardHeader>
                      <CardTitle className="text-lg">{tx.type}</CardTitle>
                      <CardDescription>
                        Token ID: {tx.tokenId} • {new Date(tx.timestamp).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                      {tx.lockHash && (
                        <a
                          href={getTransactionExplorerLink(tx.lockHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Lock Transaction ↗
                        </a>
                      )}
                      {tx.mintHash && (
                        <a
                          href={getTransactionExplorerLink(tx.mintHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Mint Transaction ↗
                        </a>
                      )}
                      {tx.burnHash && (
                        <a
                          href={getTransactionExplorerLink(tx.burnHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Burn Transaction ↗
                        </a>
                      )}
                      {tx.unlockHash && (
                        <a
                          href={getTransactionExplorerLink(tx.unlockHash)}
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
                          tx.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'Failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
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
    </main>
  );
}