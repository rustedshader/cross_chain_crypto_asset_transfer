"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaCopy } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { setChain } from "@/redux/walletSlice";

interface ChainInfo {
  name: string;
  chainId: string;
}

interface Token {
  symbol: string;
  balance: string;
  usdValue: string;
}

interface Transaction {
  type: string;
  amount: string;
  usdValue: string;
  icon?: string; // you can store an icon or image URL
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;           // e.g. "0x3752...ecd1"
  usdBalance: string;        // e.g. "0.26"
  tokens: Token[];           // array of token objects
  transactions: Transaction[]; // array of transaction objects
  chainList: ChainInfo[];    // array of chains to display
  currentChain: string;      // current chain from Redux (e.g. "amoy")
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
}) => {
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"Crypto" | "Transactions" | "Settings">("Crypto");

  const dispatch = useAppDispatch();

  const dropdownRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
  // Sync local selectedChain state with the chain from Redux
  useEffect(() => {
    const foundChain = chainList.find((c) => c.chainId === currentChain);
    if (foundChain) {
      setSelectedChain(foundChain);
    } else {
      // If we can’t find it, default to the first chain in the list
      setSelectedChain(chainList[0] || null);
    }
  }, [currentChain, chainList]);

  // Handle chain selection
  const handleChainSelect = (chain: ChainInfo) => {
    setShowChainDropdown(false);
    dispatch(setChain(chain.chainId));
  };

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(address);
    // alert("Address copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[600px] bg-[#1B1B1B] text-white rounded-xl shadow-lg overflow-hidden z-50"
    >
      {/* HEADER */}
      <div className="flex flex-col p-4 border-b border-gray-700">
        {/* Top row: Address + Copy + Chain selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</span>
            <button onClick={copyAddressToClipboard}>
              <FaCopy size={14} className="text-gray-400 hover:text-white" />
            </button>
          </div>
          {/* Chain selector */}
          <div className="relative">
            <button
              onClick={() => setShowChainDropdown(!showChainDropdown)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-md text-sm"
            >
              {currentChain}
              {showChainDropdown ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {showChainDropdown && (
              <ul className="absolute right-0 mt-1 w-48 bg-[#2A2A2A] border border-gray-600 rounded-md shadow-md max-h-64 overflow-auto z-50">
                {chainList.map((chain) => (
                  <li
                    key={chain.chainId}
                    onClick={() => handleChainSelect(chain)}
                    className="px-3 py-2 text-sm hover:bg-gray-600 cursor-pointer"
                  >
                    {chain.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Second row: Balance + plus button */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="text-2xl font-semibold">${usdBalance} USD</div>
            <div className="text-xs text-gray-400">Wallet balance</div>
          </div>
          {/* <button className="bg-gray-700 p-2 rounded-md hover:bg-gray-600 transition-colors">
            <FaPlus />
          </button> */}
        </div>
      </div>

      {/* BODY (Tabs) */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Render tab content */}
        {activeTab === "Crypto" && (
          <div>
            <h2 className="text-md mb-2 font-medium">Tokens</h2>
            <div className="flex flex-col gap-3">
              {tokens.map((token, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#2A2A2A] rounded-md p-3"
                >
                  {/* Token symbol + balance */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-xs font-bold">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{token.symbol}</div>
                      <div className="text-xs text-gray-400">
                        {token.balance} {token.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">${token.usdValue} USD</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Transactions" && (
          <div>
            <h2 className="text-md mb-2 font-medium">Transactions</h2>
            <div className="flex flex-col gap-2">
              {transactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#2A2A2A] rounded-md p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center" />
                    <div>
                      <div className="text-sm font-semibold truncate w-36">{tx.type}</div>
                      <div className="text-xs text-gray-400">{tx.amount}</div>
                    </div>
                  </div>
                  <div className="text-sm">{tx.usdValue}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "Settings" && (
          <div>
            <h2 className="text-md mb-2 font-medium">Settings</h2>
            <p className="text-sm text-gray-400">
              Manage wallet settings (e.g., security, network configuration, etc.)
            </p>
          </div>
        )}
      </div>

      {/* FOOTER (Tab navigation) */}
      <div className="flex items-center justify-around border-t border-gray-700 bg-[#2A2A2A] p-2">
        <button
          onClick={() => setActiveTab("Crypto")}
          className={`flex flex-col items-center justify-center px-4 py-2 ${
            activeTab === "Crypto" ? "text-white" : "text-gray-400"
          }`}
        >
          <span className="text-sm">Crypto</span>
        </button>
        {/* <button
          onClick={() => setActiveTab("Transactions")}
          className={`flex flex-col items-center justify-center px-4 py-2 ${
            activeTab === "Transactions" ? "text-white" : "text-gray-400"
          }`}
        >
          <span className="text-sm">Transactions</span>
        </button> */}
        <button
          onClick={() => setActiveTab("Settings")}
          className={`flex flex-col items-center justify-center px-4 py-2 ${
            activeTab === "Settings" ? "text-white" : "text-gray-400"
          }`}
        >
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default WalletModal;
