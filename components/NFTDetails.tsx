// NFTDetails.tsx
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {nft.name || `NFT #${nft.identifier}`}
            </CardTitle>
            {wrappedInfo?.isWrapped && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                Wrapped NFT
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-gray-400 border-gray-700">
            {nft.token_standard}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-square md:aspect-video w-full max-h-96 overflow-hidden rounded-lg"
        >
          {nft.display_image_url ? (
            <Image
              src={nft.display_image_url}
              alt={nft.name || `NFT ${nft.identifier}`}
              className="object-cover rounded-lg transform transition-transform duration-300 hover:scale-105"
              fill
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-700/50 flex items-center justify-center rounded-lg border border-gray-600/50">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium">Collection</h3>
              <p className="text-white font-medium">{nft.collection}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium">Current Chain</h3>
              <p className="text-white font-medium">{sourceChain}</p>
            </div>

            {wrappedInfo?.isWrapped && (
              <>
                <div className="space-y-2">
                  <h3 className="text-gray-400 text-sm font-medium">Original Chain</h3>
                  <p className="text-white font-medium">{wrappedInfo.originalChain}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-gray-400 text-sm font-medium">Original Contract</h3>
                  <p className="font-mono text-xs text-gray-300 break-all">
                    {wrappedInfo.originalContract}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium">Contract Address</h3>
              <p className="font-mono text-xs text-gray-300 break-all">{nft.contract}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {nft.description || "No description available"}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm font-medium">Last Updated</h3>
              <p className="text-gray-300 text-sm">
                {new Date(nft.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-700/50">
        {nft.metadata_url && (
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <a
              href={nft.metadata_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center"
            >
              View Metadata
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
        
        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <a 
            href={nft.opensea_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center"
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