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
import { BrowserProvider, formatUnits } from "ethers";
import { Wallet } from "lucide-react";
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

  const chainList = [
    { name: "Amoy", chainId: "amoy" },
    { name: "Ape Curtis", chainId: "ape_curtis" },
    { name: "Arbitrum Sepolia", chainId: "arbitrum_sepolia" },
  ];

  const tokens = [
    { symbol: "POL", balance: "0.8171", usdValue: "0.26" },
  ];

  const transactions = [
    { type: "Received", amount: "+1 ETH", usdValue: "+$1.00" },
    { type: "Sent", amount: "-0.0587 POL", usdValue: "-$0.02" },
  ];

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

      const balanceBN = await provider.getBalance(walletAddress);
      const formattedBalance = parseFloat(formatUnits(balanceBN, 18));
      dispatch(setBalance(Number(formattedBalance.toFixed(4))));
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-6">
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
            <Button onClick={connectWallet} variant="outline" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          ) : (
            <div className="relative inline-block">
              <Button
                onClick={() => setIsWalletOpen(!isWalletOpen)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Wallet
              </Button>

              <WalletModal
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                address={address}
                usdBalance={balance.toString()}
                tokens={tokens}
                transactions={transactions}
                chainList={chainList}
                currentChain={chain}
                handleLogout={handleLogout}
              />
            </div>
          )
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline">Register</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}