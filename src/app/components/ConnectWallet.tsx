"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiSolidWallet } from "react-icons/bi";
import {
  FiCopy,
  FiLogOut,
  FiCheck,
} from "react-icons/fi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";

export default function ConnectWallet() {
  const { login, authenticated, user, logout, ready, connectWallet } =
    usePrivy();
  const { wallets } = useWallets();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const dropdownRef = useRef<any>(null);

  // Get wallet address from Privy's user object (single source of truth)
  useEffect(() => {
    if (!ready) return;
    
    if (!authenticated || !user) {
      setDisplayAddress(null);
      return;
    }

    // Priority: 1. User's linked wallet, 2. First wallet from useWallets(), 3. user.wallet
    const linkedWallet = user.linkedAccounts?.find(
      (account) => account.type === "wallet"
    );
    
    if (linkedWallet && 'address' in linkedWallet) {
      setDisplayAddress(linkedWallet.address);
    } else if (wallets && wallets.length > 0 && wallets[0]?.address) {
      setDisplayAddress(wallets[0].address);
    } else if (user?.wallet?.address) {
      setDisplayAddress(user.wallet.address);
    } else {
      // For social logins without wallet, still show as connected
      setDisplayAddress(null);
    }
  }, [ready, authenticated, user, wallets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef?.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const truncateAddress = (addr: any) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLogin = async () => {
    if (!authenticated) {
      login();
    } else {
      // User is authenticated but wants to connect additional wallet
      connectWallet();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      wagmiDisconnect();
      setDisplayAddress(null);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // User is connected if authenticated via Privy (regardless of wallet type)
  const isWalletConnected = authenticated && ready;
  
  // Check if it's a social login (Google, Farcaster, etc.)
  const hasSocialLogin = user?.google || user?.farcaster || user?.discord || user?.github || user?.email;

  // Get display name for connected user
  const getDisplayName = () => {
    if (user?.google?.email) return user.google.email;
    if (user?.farcaster?.displayName) return user.farcaster.displayName;
    if (user?.discord?.username) return user.discord.username;
    if (user?.github?.username) return user.github.username;
    if (user?.email?.address) return user.email.address;
    if (displayAddress) return truncateAddress(displayAddress);
    return "Connected";
  };

  // Don't render anything until Privy is ready
  if (!ready) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {!isWalletConnected ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="flex items-center justify-center 
            bg-gradient-to-br from-blue-500 to-[#4e72b1]
            text-white p-3 sm:px-6 sm:py-3 rounded-full 
            shadow-lg hover:shadow-xl 
            transition-all duration-300 
            group relative overflow-hidden mx-auto cursor-pointer"
        >
          <BiSolidWallet className="sm:mr-2 size-5 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold">Connect Wallet</span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </motion.button>
      ) : (
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center 
              bg-gradient-to-br from-blue-50 to-blue-100 
              text-blue-800 px-4 py-2 rounded-full 
              shadow-md hover:shadow-lg 
              hover:rounded-full
              transition-all duration-300 
              group relative"
          >
            <BiSolidWallet className="mr-2 size-6 text-blue-600 group-hover:rotate-6 transition-transform" />
            <span className="font-medium">
              {displayAddress ? truncateAddress(displayAddress) : getDisplayName()}
            </span>
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity hover:rounded-full"></div>
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-64 bg-white 
                  rounded-xl shadow-2xl ring-2 ring-blue-100 
                  overflow-hidden z-[9999]"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                  <p className="text-sm text-black">Connected as:</p>
                  <p className="font-bold text-blue-800 truncate">
                    {getDisplayName()}
                  </p>
                  {displayAddress && hasSocialLogin && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {truncateAddress(displayAddress)}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-blue-100">
                  {displayAddress && (
                    <button
                      onClick={handleCopyAddress}
                      className="w-full flex items-center justify-between 
                        px-4 py-3 text-sm text-black 
                        hover:bg-blue-50 transition-colors 
                        group relative cursor-pointer"
                    >
                      <div className="flex items-center">
                        {copiedAddress ? (
                          <FiCheck className="mr-2 size-5 text-green-500" />
                        ) : (
                          <FiCopy className="mr-2 size-5 text-blue-500" />
                        )}
                        {copiedAddress ? "Copied!" : "Copy Address"}
                      </div>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between 
                      px-4 py-3 text-sm text-red-600 
                      hover:bg-red-50 transition-colors 
                      group relative cursor-pointer"
                  >
                    <div className="flex items-center">
                      <FiLogOut className="mr-2 size-5" />
                      Logout
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}