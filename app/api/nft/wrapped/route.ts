// app/api/nft/wrapped/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");
  const currentChain = searchParams.get("chain");

  if (!tokenId || !currentChain) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        tokenId: tokenId,
        isActive: true,
        targetChain: currentChain,
        type: "LOCK_AND_MINT",
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!transaction) {
      return NextResponse.json({ isWrapped: false });
    }

    return NextResponse.json({
      isWrapped: true,
      originalChain: transaction.sourceChain || "",
      originalContract: transaction.sourceContract || "",
      transferId: transaction.transferId || "",
      transaction: transaction,
    });
  } catch (error) {
    console.error("Error checking wrapped NFT status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}