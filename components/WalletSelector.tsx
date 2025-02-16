import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from 'next/image';
interface WalletOption {
  name: string;
  id: string;
  logo: string;
  description: string;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: WalletOption) => void;
}

const walletOptions: WalletOption[] = [
  {
    name: "MetaMask",
    id: "metamask",
    logo: "/metamask.svg",
    description: "The most popular Ethereum wallet"
  },
//   {
//     name: "Coinbase Wallet",
//     id: "coinbase",
//     logo: "https://storage.googleapis.com/coinbase-wallet-assets/icons/v2/generic-dark.svg",
//     description: "The secure wallet by Coinbase"
//   },
//   {
//     name: "WalletConnect",
//     id: "walletconnect",
//     logo: "https://explorer-api.walletconnect.com/v3/logo/lg/8aad407d-3c34-4f38-8af5-9b33f2c6c2a1?projectId=2f05ae7f1116030fde2d36508f472bfb",
//     description: "Connect to mobile wallets"
//   },
//   {
//     name: "Phantom",
//     id: "phantom",
//     logo: "https://phantom.app/img/phantom-logo.svg",
//     description: "Solana's top wallet"
//   },
//   {
//     name: "Trust Wallet",
//     id: "trust",
//     logo: "https://trustwallet.com/assets/images/trust_platform.svg",
//     description: "Multi-chain mobile wallet"
//   }
];

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Wallet</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Choose your preferred wallet to connect to our platform
        </p>

        <div className="space-y-3">
          {walletOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className="w-full flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                       group focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 flex-shrink-0 mr-4">
                   <Image
                    src={option.logo}
                    alt={`${option.name} logo`}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {option.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="ml-4">
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            New to Ethereum?{' '}
            <a
              href="#"
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://ethereum.org/en/wallets/', '_blank');
              }}
            >
              Learn more about wallets
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;