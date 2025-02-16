// app/api/nft/batch-wrapped/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenIds = searchParams.get("tokenIds");
  const currentChain = searchParams.get("chain");

  if (!tokenIds || !currentChain) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const tokenIdArray = tokenIds.split(",");

    const transactions = await prisma.transaction.findMany({
      where: {
        tokenId: {
          in: tokenIdArray,
        },
        isActive: true,
        targetChain: currentChain,
        type: "LOCK_AND_MINT",
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Create a map of tokenId to wrapped info
    const wrappedInfoMap = transactions.reduce((acc, transaction) => {
      if (!transaction.tokenId) {
        return acc;
      }

      acc[transaction.tokenId] = {
        isWrapped: true,
        originalChain: transaction.sourceChain,
        originalContract: transaction.sourceContract,
        transferId: transaction.transferId,
        transaction: transaction,
      };
      return acc;
    }, {} as Record<string, any>);

    // For any tokenId not found in transactions, add default unwrapped state
    tokenIdArray.forEach((tokenId) => {
      if (!wrappedInfoMap[tokenId]) {
        wrappedInfoMap[tokenId] = {
          isWrapped: false,
        };
      }
    });

    return NextResponse.json(wrappedInfoMap);
  } catch (error) {
    console.error("Error checking wrapped NFT status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
