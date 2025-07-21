"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiSolidWallet } from "react-icons/bi";
import {
  FiArrowUpRight,
  FiCopy,
  FiExternalLink,
  FiLogOut,
  FiCheck,
} from "react-icons/fi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useEnsName, useDisconnect } from "wagmi";
// import { CheckIcon } from "lucide-react";

export default function ConnectWallet() {
  const { login, authenticated, user, logout, ready, connectWallet } =
    usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<
    string | null | `0x${string}` | undefined
  >(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<any>(null);

  // console.log("------------");
  // console.log("isConnected", isConnected);
  // console.log("authenticated", authenticated);
  // console.log("address", address);
  // console.log("wallets", wallets);
  // console.log("ready", ready);
  // console.log("user", user);

  // Wait for Privy to be ready before making decisions
  useEffect(() => {
    if (ready) {
      setIsInitialized(true);
    }
  }, [ready]);

  useEffect(() => {
    // Don't process until Privy is ready
    if (!isInitialized || !ready) return;

    // Check if there's a social login
    const hasSocialLogin = user?.google || user?.farcaster;

    // If there's a social login, use the address as-is
    if (hasSocialLogin && address) {
      setDisplayAddress(address);
      return;
    }

    // If user is authenticated but no wallets yet, wait for them to load
    if (authenticated && wallets.length === 0) {
      return;
    }

    // Find connected wallet from Privy wallets
    const connectedWallet = wallets.find(
      (wallet) =>
        wallet.address &&
        wallet.address === address &&
        wallet.walletClientType !== "privy" // Prefer external wallets
    );

    if (connectedWallet && authenticated) {
      setDisplayAddress(connectedWallet.address);
    } else if (authenticated && address) {
      // Fallback: if we have an address and user is authenticated, use it
      setDisplayAddress(address);
    } else if (!authenticated) {
      // Clear display address if not authenticated
      setDisplayAddress(null);
    }

    // Only disconnect if user explicitly logged out (not on page refresh)
    // Remove the automatic wagmiDisconnect call that was causing issues
  }, [wallets, address, user, authenticated, ready, isInitialized]);

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
      try {
        await login();
      } catch (error) {
        console.error("Login failed:", error);
      }
    } else {
      // If authenticated but no wallet connected, try to connect
      if (!displayAddress && (!user?.google && !user?.farcaster)) {
        try {
          await connectWallet();
        } catch (error) {
          console.error("Wallet connection failed:", error);
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      setDisplayAddress(null);
      setIsDropdownOpen(false);

      // Disconnect wagmi first, then Privy
      if (isConnected) {
        wagmiDisconnect();
      }

      // Small delay to ensure wagmi disconnection completes
      setTimeout(async () => {
        await logout();
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Don't render anything until Privy is ready
  if (!isInitialized || !ready) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isWalletConnected = authenticated && (
    user?.google ||
    user?.farcaster ||
    displayAddress !== null
  );

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
              {displayAddress && truncateAddress(displayAddress)}
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
                    {user?.google?.email ||
                      user?.farcaster?.displayName ||
                      ensName ||
                      (displayAddress && truncateAddress(displayAddress))}
                  </p>
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