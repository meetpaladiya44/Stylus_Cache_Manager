import { getAccessToken, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export function PrivyAuthHandler() {
  const { user, ready, getAccessToken, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const searchParams = useSearchParams();
  const processedWalletRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isProcessingRef = useRef(false);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleUserLogin = async () => {
      // Prevent multiple simultaneous executions
      if (isProcessingRef.current) return;

      if (!ready || !user || !mounted || !authenticated) return;

      try {
        isProcessingRef.current = true;

        const token = await getAccessToken();
        const referrerParam = searchParams.get("referrer");

        // Wait for wallets to be properly initialized with a timeout
        let retries = 0;
        const maxRetries = 10;

        while ((!wallets || wallets.length === 0) && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          retries++;
        }

        if (!wallets || wallets.length === 0) {
          console.log("No wallets found after waiting");
          return;
        }

        // Get verified wallets from user object
        const verifiedWallets = user.linkedAccounts
          .filter((account) => account.type === "wallet")
          .map((account) => account.address);

        // Find a wallet that is both connected and verified
        const selectedWallet = wallets.find(
          (wallet) => wallet.address && verifiedWallets.includes(wallet.address)
        );

        if (!selectedWallet) {
          console.log(
            "No verified wallet found. Available wallets:",
            wallets.map((w) => w.address)
          );
          return;
        }

        // Ensure we have a valid address
        if (!selectedWallet.address) {
          console.error("Selected wallet has no address");
          return;
        }

        // Check if we've already processed this wallet
        if (processedWalletRef.current === selectedWallet.address) {
          return;
        }

        // Store the processed wallet address
        processedWalletRef.current = selectedWallet.address;

        // Create or verify account
        await createOrVerifyAccount(selectedWallet.address, token, referrerParam);
      } catch (error) {
        console.error("Error handling user login:", error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleUserLogin();
  }, [user, ready, wallets, mounted, searchParams, authenticated]);

  // Reset processed wallet when user logs out
  useEffect(() => {
    if (!authenticated) {
      processedWalletRef.current = null;
      isProcessingRef.current = false;
    }
  }, [authenticated]);

  // Don't render anything during SSR or before mount
  if (!mounted) {
    return null;
  }

  return null;
}

// Updated createOrVerifyAccount function
async function createOrVerifyAccount(
  walletAddress: string,
  token: string | null,
  referrer: string | null
) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/accountcreate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wallet-address": walletAddress,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        address: walletAddress,
        isEmailVisible: false,
        createdAt: new Date(),
        referrer: referrer,
      }),
    });

    const responseText = await response.text();

    if (response.status === 200) {
      console.log("Account created successfully");
    } else if (response.status === 409) {
      console.log("Account already exists");
    } else {
      throw new Error(`Failed to create/verify account: ${responseText}`);
    }
  } catch (error) {
    console.error("Error creating/verifying account:", error);
    // Don't re-throw the error to prevent loops
  }
}
