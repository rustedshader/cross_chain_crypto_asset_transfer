import React, { useState, useEffect } from "react";
import { CONSTANTS } from "@/lib/constants";
import { NFT, Transaction } from "@/types";
import NFTDetails from "./NFTDetails";
import BridgeActions from "./BridgeAction";
import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { getWrappedNFTInfo, WrappedNFTInfo } from "@/utils/nftUtils";

interface NFTModalProps {
  nft: NFT;
  onClose: () => void;
  sourceChain: keyof typeof CONSTANTS.CHAIN_CONFIG;
  onTransferSuccess: () => void;
}

const NFTModal: React.FC<NFTModalProps> = ({ 
  nft, 
  onClose, 
  sourceChain,
  onTransferSuccess 
}) => {
  const [wrappedInfo, setWrappedInfo] = useState<WrappedNFTInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadWrappedInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getWrappedNFTInfo(nft, sourceChain);
        setWrappedInfo(info);
      } catch (error) {
        console.error("Error loading wrapped NFT info:", error);
      }
      setIsLoading(false);
    };

    loadWrappedInfo();
  }, [nft, sourceChain]);

  const addTransaction = (tx: Transaction) => {
    if (tx.status === "Completed") {
      toast.success(
        wrappedInfo?.isWrapped 
          ? "NFT successfully returned to original chain!" 
          : "NFT successfully bridged to new chain!", 
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      
      // Close modal and refresh gallery after a short delay
      setTimeout(() => {
        onClose();
        onTransferSuccess();
      }, 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative mx-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>

        <div className="space-y-6">
          {/* NFT Details */}
          <NFTDetails 
            sourceChain={sourceChain} 
            nft={nft} 
            wrappedInfo={wrappedInfo}
          />

          {/* Cross-Chain Bridge Actions */}
          {!isLoading && (
            <BridgeActions
              sourceChain={sourceChain}
              nft={nft}
              wrappedInfo={wrappedInfo || undefined}
              addTransaction={addTransaction}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NFTModal;