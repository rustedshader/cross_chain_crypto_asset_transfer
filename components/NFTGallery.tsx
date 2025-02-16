import React, { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { setChain, setWalletAddress, setBalance } from "@/redux/walletSlice";
import NFTModal from "./NFTModal";
import { NFT } from "@/types";
import { CONSTANTS } from "@/lib/constants";
import Image from "next/image";
import { motion } from "framer-motion";
import { RefreshCw, Wallet } from "lucide-react";
import { getBatchWrappedNFTInfo } from "@/utils/nftUtils";
import { BrowserProvider, formatUnits } from "ethers";
import { Badge } from "@/components/ui/badge";

const WalletNotConnected = ({ onConnect }: { onConnect: () => Promise<void> }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-800/50 rounded-lg">
    <div className="bg-gray-700 p-6 rounded-full mb-6">
      <Wallet className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold text-gray-200 mb-3">Wallet Not Connected</h3>
    <p className="text-gray-400 text-center max-w-md mb-6">
      Connect your wallet to view your NFT collection across different chains and manage your digital assets.
    </p>
    <Button 
      variant="secondary" 
      className="px-6 flex items-center gap-2"
      onClick={onConnect}
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  </div>
);

export default function NFTGallery() {
  const dispatch = useAppDispatch();
  const { address, chain, isConnected, recentCompletedTx } = useAppSelector(
    (state: RootState) => state.wallet
  );

  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setErrorMessage("Please install MetaMask!");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      dispatch(setWalletAddress(walletAddress));

      const balanceBN = await provider.getBalance(walletAddress);
      const formattedBalance = parseFloat(formatUnits(balanceBN, 18));
      dispatch(setBalance(Number(formattedBalance.toFixed(4))));
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setErrorMessage("Failed to connect wallet. Please try again.");
    }
  };

  const fetchNFTs = useCallback(async () => {
    if (!isConnected || !address) return;

    setErrorMessage("");
    setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": "3c425fb533ed4602be376f8b83949233",
        },
      };
      let apiUrl = ``
      if (chain === "OP_SEPOLIA"){
        apiUrl = `https://testnets-api.opensea.io/api/v2/chain/optimism_sepolia/account/${address}/nfts`;
      }
      else{
       apiUrl = `https://testnets-api.opensea.io/api/v2/chain/${chain.toLowerCase()}/account/${address}/nfts`;
      }

      const res = await fetch(apiUrl, options);
      const data = await res.json();
      if (data.nfts && data.nfts.length > 0) {
        const wrappedInfoMap = await getBatchWrappedNFTInfo(data.nfts, chain);
        const nftsWithInfo = data.nfts.map((nft: { identifier: string; collection: string; name?: string; display_image_url?: string ;wrappedInfo? : any}) => ({
          ...nft,
          wrappedInfo: wrappedInfoMap[nft.identifier]
        }));
        setNFTs(nftsWithInfo);
      } else {
        setNFTs([]);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setErrorMessage("Failed to fetch NFTs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, chain, isConnected]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  const handleRefresh = () => {
    fetchNFTs();
  };

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">NFT Gallery</h2>
          <p className="text-sm text-gray-400">
            View and manage your NFTs across different chains
          </p>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-4">
            <select
              value={chain}
              onChange={(e) => dispatch(setChain(e.target.value as keyof typeof CONSTANTS.CHAIN_CONFIG))}
              className="border border-gray-600 rounded-md p-2 text-sm bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            >
              {CONSTANTS.AVAILABLE_CHAINS.map((chain) => (
                <option key={chain.chainId} value={chain.chainId}>
                  {chain.name}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!isConnected ? (
        <WalletNotConnected onConnect={connectWallet} />
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={idx} className="h-64 w-full" />
              ))}
            </div>
          ) : nfts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {nfts.map((nft, index) => (
                <motion.div
                  key={`${nft.collection}-${nft.identifier}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <CardHeader>
                      <CardTitle className="text-sm truncate">
                        {nft.name || `NFT #${nft.identifier}`}
                      </CardTitle>
                      {nft?.wrappedInfo.isWrapped && (
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                        Wrapped NFT
                      </Badge>
                    )}
                    </CardHeader>
                    <CardContent>
                      {nft.display_image_url ? (
                        <div className="relative group">
                          <Image
                            src={nft.display_image_url}
                            alt={nft.name || `NFT ${nft.identifier}`}
                            className="w-full h-40 object-cover rounded-md transition-transform duration-200 group-hover:scale-105"
                            width={300}
                            height={160}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-md" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-700 flex items-center justify-center rounded-md">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      <p className="text-xs mt-2 text-gray-400 truncate">
                        Collection: {nft.collection}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">
                No NFTs found for this address on the {CONSTANTS.AVAILABLE_CHAINS.filter((x) => (x.chainId === chain))[0].name.toLocaleUpperCase()} chain.
              </p>
            </div>
          )}
        </>
      )}

      {selectedNFT && (
        <NFTModal
          nft={selectedNFT}
          sourceChain={chain}
          onClose={() => setSelectedNFT(null)}
          onTransferSuccess={handleRefresh}
        />
      )}
    </div>
  );
}