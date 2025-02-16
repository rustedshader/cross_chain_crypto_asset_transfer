// NFTModal.tsx
import React, { useState, useEffect } from "react";
import { CONSTANTS } from "@/lib/constants";
import { NFT, Transaction } from "@/types";
import NFTDetails from "./NFTDetails";
import BridgeActions from "./BridgeAction";
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
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
      
      setTimeout(() => {
        onClose();
        onTransferSuccess();
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-gray-900 shadow-2xl border border-gray-800"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors duration-200 z-10"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-white" />
              </motion.button>

              <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="p-6 space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-gray-400">Loading NFT details...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <NFTDetails 
                        sourceChain={sourceChain} 
                        nft={nft} 
                        wrappedInfo={wrappedInfo}
                      />
                      <BridgeActions
                        sourceChain={sourceChain}
                        nft={nft}
                        wrappedInfo={wrappedInfo || undefined}
                        addTransaction={addTransaction}
                      />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NFTModal;