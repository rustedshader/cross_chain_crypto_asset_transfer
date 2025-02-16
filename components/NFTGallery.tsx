"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { setChain } from "@/redux/walletSlice";
import NFTModal, { NFT } from "./NFTModal";
import { CONSTANTS } from "@/lib/constants";

export default function NFTGallery() {
  const dispatch = useAppDispatch();
  const { address, chain, isConnected } = useAppSelector(
    (state: RootState) => state.wallet
  );

  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!isConnected || !address) return;

    setErrorMessage("");
    setIsLoading(true);
    try {
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": "3c425fb533ed4602be376f8b83949233",
        },
      };
      const apiUrl = `https://testnets-api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts`;
      const res = await fetch(apiUrl, options);
      const data = await res.json();
      if (data.nfts) {
        setNFTs(data.nfts);
      } else {
        setNFTs([]);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setErrorMessage("Failed to fetch NFTs");
    } finally {
      setIsLoading(false);
    }
  }, [address, chain, isConnected]);

  // Fetch whenever the chain or address changes
  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-2">NFT Gallery</h2>
      <p className="text-sm text-gray-400 mb-6">
        Fetch NFTs from OpenSea’s testnet API.
      </p>

      {!isConnected ? (
        <Alert variant="destructive">
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet from the NavBar to view NFTs.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Chain selection + Refresh button */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="chain-select" className="text-sm font-medium">
                Select Chain:
              </label>
              <select
                id="chain-select"
                value={chain}
                onChange={(e) => dispatch(setChain(e.target.value as keyof typeof CONSTANTS.CHAIN_CONFIG))}
                className="border border-gray-300 rounded-md p-2 text-sm bg-gray-700 text-white"
              >
              {CONSTANTS.AVAILABLE_CHAINS.map((chain) => (
              <option key={chain.chainId} value={chain.chainId}>
                {chain.name}
              </option>
            ))}
              </select>
            </div>
            <Button variant="secondary" onClick={fetchNFTs}>
              Refresh
            </Button>
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-64 w-full" />
              ))}
            </div>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {nfts.map((nft) => (
                <Card
                  key={nft.identifier}
                  className="bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedNFT(nft)}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {nft.name || `NFT #${nft.identifier}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nft.display_image_url ? (
                      <img
                        src={nft.display_image_url}
                        alt={nft.name || `NFT ${nft.identifier}`}
                        className="w-full h-40 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-700 flex items-center justify-center rounded-md">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <p className="text-xs mt-2 text-gray-400">
                      Collection: {nft.collection}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">
              No NFTs found for this address on the {chain} chain.
            </p>
          )}
        </>
      )}

      {/* Modal for NFT Details */}
      {selectedNFT && (
        <NFTModal nft={selectedNFT} sourceChain={chain} onClose={() => setSelectedNFT(null)} />
      )}
    </div>
  );
}
