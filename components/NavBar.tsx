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
import { Wallet, Home, User, History } from "lucide-react";
import WalletModal from "./WalletModal";
import {
  fetchTokenBalances,
  fetchTransactionsFromEtherscan,
} from "@/utils/walletUtils";
import { CONSTANTS } from "@/lib/constants";
import { Token, Transaction, ChainInfo } from "@/types/walletTypes";
import WalletSelector from "./WalletSelector"; // Add this import
import Logo from "./Logo";

interface WalletOption {
  name: string;
  id: string;
  // You can add an icon or other metadata here if needed.
}

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<Token[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );

  const supabase = createClient();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address, balance, isConnected, chain } = useAppSelector(
    (state: RootState) => state.wallet
  );

  const chainList = CONSTANTS.AVAILABLE_CHAINS;

  // List of available wallet options
  const walletOptions: WalletOption[] = [
    { name: "MetaMask", id: "metamask" },
    // Add additional wallets as needed, e.g. WalletConnect, Coinbase Wallet, etc.
  ];

  // Fetch token balances and transactions whenever the wallet address changes
  useEffect(() => {
    const fetchData = async () => {
      if (address && window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const balances = await fetchTokenBalances(provider, address);
        const transactions = await fetchTransactionsFromEtherscan(address);
        setTokenBalance(balances);
        setTransactionHistory(transactions);
      }
    };
    fetchData();
  }, [address, chain]);

  // Calculate the total USD value from token balances and update the balance slice
  useEffect(() => {
    if (tokenBalance.length > 0) {
      const totalUsd = tokenBalance.reduce((acc, token) => {
        return acc + parseFloat(token.usdValue || "0");
      }, 0);
      dispatch(setBalance(Number(totalUsd.toFixed(4))));
    }
  }, [tokenBalance, dispatch]);

  // Listen to session changes
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

  // Function to handle connection via MetaMask
  const connectMetaMask = async () => {
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
      // Wallet options modal can be closed after connection
      setShowWalletOptions(false);
    } catch (error) {
      console.error("Error connecting MetaMask:", error);
    }
  };

  // When the "Connect Wallet" button is clicked, show the wallet options modal
  const handleConnectWalletClick = () => {
    setShowWalletOptions(true);
  };

  const handleWalletOptionSelect = async (option: WalletOption) => {
    try {
      switch (option.id) {
        case "metamask":
          if (!window.ethereum?.isMetaMask) {
            window.open("https://metamask.io/download/", "_blank");
            return;
          }
          await connectMetaMask();
          break;

        default:
          alert(`${option.name} integration coming soon!`);
      }
      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting ${option.name}:`, error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
    {/* Add a spacer div to push content down */}
    <div className="h-16" />
    
    {/* Navbar */}
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-md bg-gray-900/80 border-b border-gray-800/50 shadow-lg">
        <nav className="px-4">
          {/* Rest of the navbar content remains the same */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex-shrink-0">
                <Logo />
              </Link>
              
              {session && (
                <div className="hidden md:flex items-center gap-1">
                  <Link 
                    href="/" 
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link 
                    href="/profile" 
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link 
                    href="/transactions" 
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Transactions
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {session ? (
                !isConnected ? (
                  <Button
                    onClick={handleConnectWalletClick}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="relative inline-block">
                    <Button
                      onClick={() => setIsWalletOpen(!isWalletOpen)}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all border border-gray-700"
                    >
                      <Wallet className="w-4 h-4" />
                      Wallet
                    </Button>
                    <WalletModal
                      isOpen={isWalletOpen}
                      onClose={() => setIsWalletOpen(false)}
                      address={address}
                      usdBalance={balance.toString()}
                      tokens={tokenBalance}
                      transactions={transactionHistory}
                      chainList={chainList}
                      currentChain={chain}
                      handleLogout={handleLogout}
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <Button 
                      variant="ghost" 
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
                    >
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {showWalletOptions && (
        <WalletSelector
          isOpen={showWalletOptions}
          onClose={() => setShowWalletOptions(false)}
          onSelect={handleWalletOptionSelect}
        />
      )}
    </div>
  </>
  );
}
