"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { getExplorerLink } from "@/lib/utils";
import { CONSTANTS } from "@/lib/constants";

import { Transaction } from "@/types";

// ─────────────────────────────────────────────
// TransactionHistory Component – displays recent transactions
// ─────────────────────────────────────────────

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
}) => {
  return (
    <Card className="bg-gray-800 text-white mt-6">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          View your recent cross-chain transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <Card key={index} className="bg-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">{tx.type}</CardTitle>
                <CardDescription>
                  Token ID: {tx.tokenId} •{" "}
                  {new Date(tx.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {tx.lockHash && (
                  <a
                    href={getExplorerLink(tx.lockHash, CONSTANTS.AMOY_CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Lock Transaction ↗
                  </a>
                )}
                {tx.mintHash && (
                  <a
                    href={getExplorerLink(
                      tx.mintHash,
                      tx.type.includes("Chain B")
                        ? CONSTANTS.CARDONA_CHAIN_ID
                        : CONSTANTS.AMOY_CHAIN_ID
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Mint Transaction ↗
                  </a>
                )}
                {tx.burnHash && (
                  <a
                    href={getExplorerLink(
                      tx.burnHash,
                      CONSTANTS.CARDONA_CHAIN_ID
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Burn Transaction ↗
                  </a>
                )}
                {tx.unlockHash && (
                  <a
                    href={getExplorerLink(
                      tx.unlockHash,
                      CONSTANTS.AMOY_CHAIN_ID
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Unlock Transaction ↗
                  </a>
                )}
              </CardContent>
              <CardFooter>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : tx.status === "Failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {tx.status}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;