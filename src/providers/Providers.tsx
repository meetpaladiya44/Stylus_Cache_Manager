"use client";

import React from "react";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { PrivyProvider } from "@privy-io/react-auth";
import { http } from "viem";
import {
  mainnet,
  optimism,
  arbitrum,
  arbitrumSepolia,
  optimismSepolia,
} from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import { PrivyAuthHandler } from "./PrivyAuthHandler";

interface Web3ProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

// Wagmi configuration
const wagmiConfig = createConfig({
  chains: [optimism, arbitrum, arbitrumSepolia, optimismSepolia, mainnet],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});

// Privy configuration - Updated to prevent auto-connection issues
const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
    requireUserPasswordOnCreate: true,
    // noPromptOnSignature: true, // Prevent automatic signature prompts
  },
  loginMethods: ["wallet"],
  appearance: {
    showWalletLoginFirst: true,
  },
  defaultChain: arbitrum, // Changed to arbitrum as that's what your cache manager uses
  // Prevent automatic wallet connection attempts
  // integrateWithWagmi: false, // This prevents conflicts between Privy and Wagmi
}

const queryClient = new QueryClient();

export default function Providers({ children }: Web3ProviderProps) {
  return (
    // <ThemeProvider>
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyAuthHandler />
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
    // </ThemeProvider>
  );
}