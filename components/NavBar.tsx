"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setWalletAddress, setBalance } from "@/redux/walletSlice";
import { RootState } from "@/redux/store";
import { BrowserProvider, ethers, formatUnits } from "ethers";
import WalletModal from "./WalletModal";

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { address, balance, isConnected, chain } = useAppSelector(
    (state: RootState) => state.wallet
  );

  // Example chain list, tokens, transactions
  const chainList = [
    { name: "Amoy", chainId: "amoy" },
    { name: "Ape Curtis", chainId: "ape_curtis" },
    { name: "Arbitrum Sepolia", chainId: "arbitrum_sepolia" },
    // ...
  ];
  const tokens = [
    { symbol: "POL", balance: "0.8171", usdValue: "0.26" },
  ];
  const transactions = [
    { type: "Received", amount: "+1 ETH", usdValue: "+$1.00" },
    { type: "Unrecognized tr...", amount: "-0.0587 POL", usdValue: "-$0.02" },
  ];

  // Check Supabase auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      dispatch(setWalletAddress(walletAddress));

      // Fetch native token balance
      const balanceBN = await provider.getBalance(walletAddress);
      // const balance = ethers.formatEther(balanceBN);
      // console.log("Balance:", balance);
      const formattedBalance = parseFloat(formatUnits(balanceBN, 18));
      dispatch(setBalance(Number(formattedBalance.toFixed(4))));
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Supabase logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {session && (
          <>
            <Link href="/" className="text-sm font-medium hover:text-gray-300">
              Home
            </Link>
            <Link href="/profile" className="text-sm font-medium hover:text-gray-300">
              Profile
            </Link>
            <Link href="/transactions" className="text-sm font-medium hover:text-gray-300">
              Transactions
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          !isConnected ? (
            <Button onClick={connectWallet} variant="secondary">
              Connect Wallet
            </Button>
          ) : (
            <>
              {/* Wrap the address button + dropdown in a relative container */}
              <div className="relative">
                <button
                  className="bg-gray-800 px-3 py-2 rounded text-sm font-medium hover:bg-gray-700"
                  onClick={() => setIsWalletOpen((prev) => !prev)}
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                </button>

                {/* Our new WalletModal as a dropdown */}
                <WalletModal
                  isOpen={isWalletOpen}
                  onClose={() => setIsWalletOpen(false)}
                  address={address || "0x0000...0000"}
                  usdBalance={balance.toString()}
                  tokens={tokens}
                  transactions={transactions}
                  chainList={chainList}
                  currentChain={chain}
                />
              </div>

              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )
        ) : (
          <>
            <Link href="/auth/login" className="text-sm">
              Login
            </Link>
            <Link href="/auth/register" className="text-sm ml-4">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
