import { getMongoClient } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { AuthTokenClaims, PrivyClient } from "@privy-io/server-auth";

const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_SECRET!
);

interface DelegateRequestBody {
  address: string;
  isEmailVisible: boolean;
  createdAt: Date;
  referrer: string | null;
}

export async function POST(req: NextRequest) {
  let client;
  try {
    // Privy token verification
    const authHeader = req.headers.get("Authorization");
    console.log("authHeader", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    const privyToken = authHeader.split(" ")[1];

    try {
      // Verify the Privy token
      const verifiedUser: AuthTokenClaims = await privyClient.verifyAuthToken(
        privyToken
      );

      const verifiedUserId = verifiedUser.userId;

      // Get full user details
      const userDetails = await privyClient.getUser(verifiedUserId);

      // Get request wallet address from header
      const requestWalletAddress = req.headers.get("x-wallet-address");
      if (!requestWalletAddress) {
        return NextResponse.json(
          { error: "No wallet address provided in request" },
          { status: 401 }
        );
      }

      // Check all linked wallets for a match
      const linkedWallets = userDetails.linkedAccounts.filter(
        (account) => account.type === "wallet"
      );

      const verifiedWallet = linkedWallets.find(
        (wallet) => wallet.type === "wallet" && wallet.address === requestWalletAddress
      );

      if (!verifiedWallet) {
        return NextResponse.json(
          { error: "Wallet address not found in user's linked accounts" },
          { status: 401 }
        );
      }

      // Get request body
      const {
        address,
        isEmailVisible,
        createdAt,
        referrer,
      }: DelegateRequestBody = await req.json();

      // Connect to database
      client = await getMongoClient();
      const db = client.db("smartcache");
      const collection = db.collection("users");

      // Check if delegate already exists
      const existingDocument = await collection.findOne({
        address: requestWalletAddress,
      });

      if (existingDocument) {
        return NextResponse.json(
          { result: "Already Exists!" },
          { status: 409 }
        );
      }

      // Create new delegate document
      const newDocument = {
        address: requestWalletAddress.toLowerCase(), // Use the exact wallet address
        createdAt,
        image: null,
        displayName: null,
        socialHandles: null,
      };

      // Insert document
      const result = await collection.insertOne(newDocument);

      if (result.insertedId) {
        const insertedDocument = await collection.findOne({
          _id: result.insertedId,
        });
        return NextResponse.json({ result: insertedDocument }, { status: 200 });
      } else {
        return NextResponse.json(
          { error: "Failed to insert document" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error storing delegate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
