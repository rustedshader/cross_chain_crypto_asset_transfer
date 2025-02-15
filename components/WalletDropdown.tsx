"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { resetWallet } from "@/redux/walletSlice";

interface WalletDropdownProps {
  address: string;
  balance: number;
  handleLogout: () => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({
  address,
  balance,
  handleLogout,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const disconnectWallet = () => {
    dispatch(resetWallet());
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-700 px-3 py-2 rounded text-sm font-medium hover:from-gray-700 hover:to-gray-600 transition-colors"
      >
        <span className="font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="bg-gray-900 text-xs px-2 py-1 rounded">
          {balance} POL
        </span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50 transition-opacity duration-200">
          <div className="text-sm text-gray-300 mb-3">
            <strong>Wallet Address</strong>
            <p className="mt-1 break-words text-sm">{address}</p>
          </div>
          <div className="text-sm text-gray-300 mb-3">
            <strong>Balance</strong>
            <p className="mt-1">{balance} POL</p>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={disconnectWallet}>
              Disconnect
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDropdown;
