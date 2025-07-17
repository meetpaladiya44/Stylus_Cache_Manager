"use client";

import { useState, useRef, useEffect } from "react";
import { BiSolidWallet } from "react-icons/bi";
import {
  FiArrowUpRight,
  FiCopy,
  FiExternalLink,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useEnsName, useDisconnect, useSwitchChain } from "wagmi";

export function ConnectWallet() {
  // Privy and Wagmi Hooks
  const { login, authenticated, user, logout, ready, connectWallet } =
    usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const { data: ensName } = useEnsName({ address });

  // State Management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
  const [displayAddress, setDisplayAddress] = useState<
    string | null | `0x${string}` | undefined
  >(null);

  // Refs for Outside Click Handling
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chainSelectorRef = useRef<HTMLDivElement>(null);

  // Use chains from useSwitchChain
  const SUPPORTED_CHAINS = chains;

  // Current selected chain
  const currentChain =
    SUPPORTED_CHAINS.find((chain) => chain.id === chainId) ||
    SUPPORTED_CHAINS[0];

  // Outside Click Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        chainSelectorRef.current &&
        !chainSelectorRef.current.contains(event.target as Node)
      ) {
        setIsChainSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Address and Wallet Management
  useEffect(() => {
    const hasSocialLogin = user?.google || user?.farcaster;

    if (hasSocialLogin) {
      setDisplayAddress(address);
      return;
    }

    const realWallet = wallets.find(
      (wallet) =>
        wallet.address === address && wallet.walletClientType !== "privy"
    );

    if (realWallet) {
      setDisplayAddress(realWallet.address);
    } else {
      setDisplayAddress(null);
      if (
        !hasSocialLogin &&
        wallets.every((wallet) => wallet.walletClientType === "privy")
      ) {
        wagmiDisconnect();
      }
    }
  }, [wallets, address, user]);

  // Utility Functions
  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Authentication Handlers
  const handleLogin = async () => {
    if (!authenticated) {
      login();
    } else {
      if (!user?.google && !user?.farcaster) {
        connectWallet();
      }
    }
  };

  const handleLogout = async () => {
    await logout();

    if (!user?.google && !user?.farcaster) {
      wagmiDisconnect();
      setDisplayAddress(null);
    }

    setIsDropdownOpen(false);
  };

  // Chain Switching Handler
  const handleChainSwitch = async (chainId: number) => {
    try {
      await switchChain({ chainId });
      setIsChainSelectorOpen(false);
    } catch (error) {
      console.error("Failed to switch chain", error);
    }
  };

  // Wallet Connection Status
  const isWalletConnected =
    user?.google || user?.farcaster || displayAddress !== null;

  return (
    <div className="relative flex items-center space-x-2" ref={dropdownRef}>
      {!isWalletConnected || !authenticated ? (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <BiSolidWallet className="w-5 h-5" />
          <span className="hidden md:block">Connect Wallet</span>
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="relative" ref={chainSelectorRef}>
            <button
              onClick={() => setIsChainSelectorOpen(!isChainSelectorOpen)}
              className="bg-gray-100 text-gray-800 px-3 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-200 transition-colors"
            >
              <span className="hidden md:block">{currentChain.name}</span>
              <FiChevronDown />
            </button>

            {isChainSelectorOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 ${
                      chain.id === currentChain.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <span>{chain.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <BiSolidWallet className="w-5 h-5" />
            <span className="hidden md:block">
              {displayAddress && truncateAddress(displayAddress)}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Connected as:</p>
                  <p className="font-semibold">
                    {user?.google?.email ||
                      user?.farcaster?.displayName ||
                      ensName ||
                      (displayAddress && truncateAddress(displayAddress))}
                  </p>
                </div>

                <div className="space-y-2">
                  {displayAddress && (
                    <button
                      onClick={handleCopyAddress}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                    >
                      <FiCopy />
                      <span>Copy Address</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center space-x-2 text-red-500"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
