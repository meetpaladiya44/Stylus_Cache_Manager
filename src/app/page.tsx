"use client";
import Navbar from "@/app/components/Navbar";
import Footer from "./components/Footer";
import CacheManagerDashboard from "./components/CacheManagerDashboard";
import "../app/css/Landing.css";
import CacheManagerPage from "./components/CacheManagerPage";
import { useEffect, useState } from "react";
import { getNetworkKeyByChainId } from "@/utils/CacheManagerUtils";

export default function Home() {
  const [networkKey, setNetworkKey] = useState<"arbitrum_sepolia" | "arbitrum_one">("arbitrum_sepolia");
  const [isNetworkValid, setIsNetworkValid] = useState(false);

  useEffect(() => {
    async function detectNetwork() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const provider = (window as any).ethereum;
          const chainIdHex = await provider.request({ method: "eth_chainId" });
          const chainId = parseInt(chainIdHex, 16);
          const key = getNetworkKeyByChainId(chainId);
          
          if (key) {
            setNetworkKey(key as "arbitrum_sepolia" | "arbitrum_one");
            setIsNetworkValid(true);
            console.log(`✅ Network detected: ${key} (chainId: ${chainId})`);
          } else {
            setIsNetworkValid(false);
            console.log(`⚠️ Unsupported network: ${chainId}`);
          }
        } catch (error) {
          console.error("❌ Error detecting network:", error);
          setIsNetworkValid(false);
        }
      }
    }
    
    detectNetwork();
    
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum.on("chainChanged", () => {
        console.log("🔄 Network changed, re-detecting...");
        detectNetwork();
      });
    }
  }, []);

  return (
    <div className="">
      {/* <Navbar /> */}
      <CacheManagerPage networkKey={networkKey} />
      {/* <Footer /> */}
    </div>
  );
}
