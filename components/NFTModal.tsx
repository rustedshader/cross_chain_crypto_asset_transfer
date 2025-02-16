import React, { useState } from "react";
import { CONSTANTS } from "@/lib/constants";
import { NFT, Transaction } from "@/types";
import NFTDetails from "./NFTDetails";
import BridgeActions from "./BridgeAction";
// import TransactionHistory from "./TransactionHistory";
import { toast } from 'react-toastify';
import { motion } from "framer-motion";
import { X } from "lucide-react";

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
  // const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const addTransaction = (tx: Transaction) => {
    // setTransactions((prev) => [...prev, tx]);
    if (tx.status === "Completed") {
      toast.success("NFT successfully transferred to the new chain!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
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
          <NFTDetails sourceChain={sourceChain} nft={nft} />

          {/* Cross-Chain Bridge Actions */}
          <BridgeActions
            sourceChain={sourceChain}
            nft={nft}
            addTransaction={addTransaction}
          />

         
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NFTModal;