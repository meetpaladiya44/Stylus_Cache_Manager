"use client";
import Navbar from "@/app/components/Navbar";
import Footer from "./components/Footer";
import CacheManagerDashboard from "./components/CacheManagerDashboard";
import "../app/css/Landing.css";
import CacheManagerPage from "./components/CacheManagerPage";
import { useEffect, useState } from "react";
import { getNetworkKeyByChainId } from "@/utils/CacheManagerUtils";
import { usePrivy } from "@privy-io/react-auth";

const NETWORK_STORAGE_KEY = "smartcache_last_network";

export default function Home() {
  const { authenticated: isConnected, ready: privyReady } = usePrivy();
  
  // Initialize network from localStorage or default to arbitrum_one
  const [networkKey, setNetworkKey] = useState<"arbitrum_sepolia" | "arbitrum_one">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (stored === "arbitrum_sepolia" || stored === "arbitrum_one") {
        console.log(`📂 Loaded network from storage: ${stored}`);
        return stored;
      }
    }
    console.log("📂 No stored network, using default: arbitrum_one");
    return "arbitrum_one";
  });
  
  const [isNetworkValid, setIsNetworkValid] = useState(false);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [hasConnectedBefore, setHasConnectedBefore] = useState(false);

  // Persist network selection to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(NETWORK_STORAGE_KEY, networkKey);
      console.log(`💾 Saved network to storage: ${networkKey}`);
    }
  }, [networkKey]);

  // Detect wallet network when user connects/disconnects
  useEffect(() => {
    async function detectNetwork() {
      // Priority 1: Manual selection takes highest priority
      if (isManualSelection) {
        console.log("⏭️ Skipping auto-detection (manual selection active)");
        return;
      }
      
      // Priority 2: If user is connected, detect their wallet's network
      if (isConnected) {
        setHasConnectedBefore(true); // Mark that user has connected at least once
        
        if (typeof window !== "undefined" && (window as any).ethereum) {
          try {
            const provider = (window as any).ethereum;
            const chainIdHex = await provider.request({ method: "eth_chainId" });
            const chainId = parseInt(chainIdHex, 16);
            const key = getNetworkKeyByChainId(chainId);
            
            if (key) {
              setNetworkKey(key as "arbitrum_sepolia" | "arbitrum_one");
              setIsNetworkValid(true);
              console.log(`✅ Wallet network detected: ${key} (chainId: ${chainId})`);
            } else {
              setIsNetworkValid(false);
              console.log(`⚠️ Unsupported wallet network: ${chainId}, keeping current: ${networkKey}`);
            }
          } catch (error) {
            console.error("❌ Error detecting wallet network:", error);
            setIsNetworkValid(false);
          }
        }
        return;
      }

      // Priority 3: If user is NOT connected
      // Keep the last network (from localStorage) - DON'T reset to default
      // This maintains the network that was shown when user was last connected
      console.log(`👤 User disconnected, keeping last network: ${networkKey}`);
      setIsNetworkValid(true);
    }
    
    // Only run detection when Privy is ready
    if (privyReady) {
      detectNetwork();
    }
    
    // Listen for wallet network changes
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleChainChange = () => {
        console.log("🔄 Wallet network changed, re-detecting...");
        setIsManualSelection(false); // Reset manual selection when wallet network changes
        detectNetwork();
      };
      
      (window as any).ethereum.on("chainChanged", handleChainChange);
      
      return () => {
        (window as any).ethereum.removeListener("chainChanged", handleChainChange);
      };
    }
  }, [isManualSelection, isConnected, privyReady, networkKey]);

  // Handler for manual network selection (highest priority)
  const handleNetworkChange = (newNetwork: "arbitrum_sepolia" | "arbitrum_one") => {
    setNetworkKey(newNetwork);
    setIsManualSelection(true);
    console.log(`🎯 Network manually changed to: ${newNetwork} (highest priority)`);
  };

  return (
    <div className="">
      {/* <Navbar /> */}
      <CacheManagerPage 
        networkKey={networkKey} 
        onNetworkChange={handleNetworkChange}
      />
      {/* <Footer /> */}
    </div>
  );
}
