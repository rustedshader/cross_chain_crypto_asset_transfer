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
import { BrowserProvider } from "ethers";
import { Wallet, Home, User, History, Menu, X } from "lucide-react";
import WalletModal from "./WalletModal";
import {
  fetchTokenBalances,
  fetchTransactionsFromEtherscan,
} from "@/utils/walletUtils";
import { CONSTANTS } from "@/lib/constants";
import { Token, Transaction } from "@/types/walletTypes";
import WalletSelector from "./WalletSelector";
import Logo from "./Logo";

interface WalletOption {
  name: string;
  id: string;
}

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<Token[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(
    []
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address, balance, isConnected, chain } = useAppSelector(
    (state: RootState) => state.wallet
  );

  const chainList = CONSTANTS.AVAILABLE_CHAINS;

  const walletOptions: WalletOption[] = [{ name: "MetaMask", id: "metamask" }];

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

  useEffect(() => {
    if (tokenBalance.length > 0) {
      const totalUsd = tokenBalance.reduce((acc, token) => {
        return acc + parseFloat(token.usdValue || "0");
      }, 0);
      dispatch(setBalance(Number(totalUsd.toFixed(4))));
    }
  }, [tokenBalance, dispatch]);

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
      setShowWalletOptions(false);
    } catch (error) {
      console.error("Error connecting MetaMask:", error);
    }
  };

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
    dispatch(setWalletAddress(""));
    dispatch(setBalance(0));
    window.location.href = "/auth/login";
  };

  const MobileMenu = () => (
    <div
      className={`md:hidden fixed inset-0 z-50 transform ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="absolute inset-0 bg-gray-900/95">
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-8">
            <Logo />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-3"
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-3"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link
              href="/transactions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all flex items-center gap-3"
            >
              <History className="w-5 h-5" />
              Transactions
            </Link>

            {/* Logout Button for Mobile */}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="mt-4 px-4 py-3 rounded-lg text-base font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-16" />
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-md bg-gray-900/80 border-b border-gray-800/50 shadow-lg">
          <nav className="px-4">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Logo and Navigation */}
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

              {/* Right side - Auth Buttons */}
              <div className="flex items-center gap-2 md:gap-4">
                {session ? (
                  <div className="flex items-center gap-2 md:gap-3">
                    {!isConnected ? (
                      <Button
                        onClick={handleConnectWalletClick}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
                      >
                        <Wallet className="w-4 h-4" />
                        <span className="hidden md:inline">Connect Wallet</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsWalletOpen(!isWalletOpen)}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg flex items-center gap-2 transition-all border border-gray-700"
                      >
                        <Wallet className="w-4 h-4" />
                        <span className="hidden md:inline">Wallet</span>
                      </Button>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      className="rounded-lg hidden md:flex"
                    >
                      Logout
                    </Button>
                    <Button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="md:hidden p-2"
                      variant="ghost"
                    >
                      <Menu className="w-6 h-6 text-gray-300" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 md:gap-3">
                    <Link href="/auth/login">
                      <Button
                        variant="ghost"
                        className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        <MobileMenu />

        {showWalletOptions && (
          <WalletSelector
            isOpen={showWalletOptions}
            onClose={() => setShowWalletOptions(false)}
            onSelect={handleWalletOptionSelect}
          />
        )}

        {isConnected && (
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
        )}
      </div>
    </>
  );
}
