// File: app/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  type: string;
  tokenId: string;
  lockHash?: string;
  mintHash?: string;
  burnHash?: string;
  unlockHash?: string;
  timestamp: string;
  status: string;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions?filter=${encodeURIComponent(filter)}`);
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      <Input
        type="text"
        placeholder="Filter by type, token, etc."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6"
      />
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        transactions.map((tx) => (
          <Card key={tx.id} className="mb-4">
            <CardHeader>
              <CardTitle>{tx.type}</CardTitle>
              <CardDescription>
                Token ID: {tx.tokenId} • {new Date(tx.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {tx.lockHash && <p>Lock Tx: {tx.lockHash}</p>}
              {tx.mintHash && <p>Mint Tx: {tx.mintHash}</p>}
              {tx.burnHash && <p>Burn Tx: {tx.burnHash}</p>}
              {tx.unlockHash && <p>Unlock Tx: {tx.unlockHash}</p>}
            </CardContent>
            <CardFooter>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  tx.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : tx.status === 'Failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {tx.status}
              </span>
            </CardFooter>
          </Card>
        ))
      )}
      <div className="flex justify-end">
        <Button onClick={fetchTransactions}>Refresh</Button>
      </div>
    </div>
  );
}
