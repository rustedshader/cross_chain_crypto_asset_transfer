// ─────────────────────────────────────────────
// NFTDetails Component – displays NFT information
// ─────────────────────────────────────────────

"use client";

import React from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NFT } from "@/types";

interface NFTDetailsProps {
  nft: NFT;
  sourceChain: string;
}

const NFTDetails: React.FC<NFTDetailsProps> = ({ nft, sourceChain }) => {
  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-xl">
          {nft.name || `NFT #${nft.identifier}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nft.display_image_url ? (
          <Image
            src={nft.display_image_url}
            alt={nft.name || `NFT ${nft.identifier}`}
            className="w-full h-64 object-cover rounded-md"
            width={500}
            height={256}
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
          <a href={nft.opensea_url} target="_blank" rel="noopener noreferrer">
            View on OpenSea
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NFTDetails;
