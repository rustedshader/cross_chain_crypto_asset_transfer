"use client";
import React, { useState, useRef, useEffect } from "react";
import { Wallet, X, ChevronDown, ChevronUp, Copy, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { setChain, resetWallet } from "@/redux/walletSlice";
import { CONSTANTS } from "@/lib/constants";
import { Token, Transaction, ChainInfo } from "@/types/walletTypes";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  usdBalance: string;
  tokens: Token[];
  transactions: Transaction[];
  chainList: ChainInfo[];
  currentChain: string;
  handleLogout: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  address,
  usdBalance,
  tokens,
  transactions,
  chainList,
  currentChain,
  handleLogout,
}) => {
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"assets" | "activity" | "settings">("assets");
  const modalRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const handleChainSelect = (chain: ChainInfo) => {
    setShowChainDropdown(false);
    dispatch(setChain(chain.chainId as keyof typeof CONSTANTS.CHAIN_CONFIG));
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  const disconnectWallet = () => {
    dispatch(resetWallet());
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="absolute right-0 top-12 w-96 bg-gray-900 rounded-xl shadow-xl z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">My Wallet</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Address and Chain Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <button onClick={copyAddress} className="text-gray-400 hover:text-white">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowChainDropdown(!showChainDropdown)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-lg text-sm"
            >
              {currentChain}
              {showChainDropdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showChainDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                {chainList.map((chain) => (
                  <button
                    key={chain.chainId}
                    onClick={() => handleChainSelect(chain)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors"
                  >
                    {chain.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold mb-1">${usdBalance}</div>
          <div className="text-sm text-gray-400">Total Balance</div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-4">
          {["assets", "activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-h-64 overflow-y-auto">
          {activeTab === "assets" && (
            <div className="space-y-3">
              {tokens.map((token, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.balance}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>${token.usdValue}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {tx.type === "sent" ? "Sent" : "Received"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{tx.amount}</div>
                      <div className="text-xs text-gray-400">
                        {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-sm">
                  No transactions found.
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-center text-gray-400">
              Settings content here.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Button
            onClick={disconnectWallet}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Power className="w-4 h-4" />
            Disconnect
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="flex-1">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
