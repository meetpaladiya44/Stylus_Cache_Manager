"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, arbitrumSepolia } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { useEffect, useState } from 'react'
import type { Storage } from 'wagmi';

const storage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key)
      return item
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }
} as Storage

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [arbitrumSepolia],

    transports: {
      // [mainnet.id]: http(),
      [arbitrumSepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: '39c1a2d05362a52a43d5431230eb2f10',

    // Required App Info
    appName: "arbitrum nitro stylus",
    storage
  }),
);

// Create the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{mounted && children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
