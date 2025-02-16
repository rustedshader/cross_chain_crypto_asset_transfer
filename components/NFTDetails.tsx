import React from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NFT } from "@/types";
import { WrappedNFTInfo } from "@/utils/nftUtils";
import { ExternalLink } from "lucide-react";

interface NFTDetailsProps {
  nft: NFT;
  sourceChain: string;
  wrappedInfo: WrappedNFTInfo | null;
}

const NFTDetails: React.FC<NFTDetailsProps> = ({ nft, sourceChain, wrappedInfo }) => {
  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">
            {nft.name || `NFT #${nft.identifier}`}
          </CardTitle>
          {wrappedInfo?.isWrapped && (
            <Badge variant="secondary" className="ml-2">
              Wrapped NFT
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nft.display_image_url ? (
          <div className="relative h-64 w-full">
            <Image
              src={nft.display_image_url}
              alt={nft.name || `NFT ${nft.identifier}`}
              className="rounded-md object-cover"
              fill
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-md">
            <span className="text-gray-500">No Image Available</span>
          </div>
        )}

        <div className="text-sm space-y-2">
          <p>
            <strong>Collection:</strong> {nft.collection}
          </p>
          <p>
            <strong>Current Chain:</strong> {sourceChain}
          </p>
          {wrappedInfo?.isWrapped && (
            <>
              <p>
                <strong>Original Chain:</strong> {wrappedInfo.originalChain}
              </p>
              <p>
                <strong>Original Contract:</strong>{" "}
                <span className="font-mono text-xs">
                  {wrappedInfo.originalContract}
                </span>
              </p>
            </>
          )}
          <p>
            <strong>Contract Address:</strong>{" "}
            <span className="font-mono text-xs">{nft.contract}</span>
          </p>
          <p>
            <strong>Token Standard:</strong> {nft.token_standard}
          </p>
          <p>
            <strong>Description:</strong> {nft.description || "N/A"}
          </p>
          {nft.metadata_url && (
            <p>
              <strong>Metadata URL:</strong>{" "}
              <a
                href={nft.metadata_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center"
              >
                View Metadata
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
          )}
          <p>
            <strong>Updated At:</strong>{" "}
            {new Date(nft.updated_at).toLocaleString()}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button asChild>
          <a 
            href={nft.opensea_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center"
          >
            View on OpenSea
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NFTDetails;