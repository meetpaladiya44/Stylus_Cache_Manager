"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { http } from "viem";
import {
  mainnet,
  optimism,
  arbitrum,
  arbitrumSepolia,
  optimismSepolia,
} from "viem/chains";

interface Web3ProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

// Get and validate Privy App ID
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!privyAppId) {
  console.error("❌ NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables");
  throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable");
}

console.log("✅ Privy App ID found:", privyAppId.slice(0, 8) + "...");

// Wagmi configuration
const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, optimism, arbitrum, optimismSepolia, mainnet],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});

// Privy configuration
const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  loginMethods: ["wallet", "google", "farcaster", "discord", "github", "email"],
  appearance: {
    showWalletLoginFirst: true,
    logo: "",
  },
  defaultChain: arbitrumSepolia, // Changed to match your app's network
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <PrivyProvider
      appId={privyAppId as string}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
