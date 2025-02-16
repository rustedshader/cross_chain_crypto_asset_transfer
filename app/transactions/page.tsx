'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ExternalLink,
  Clock,
  Hash,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface TransactionFilters {
  status: string;
  type: string;
  chain: string;
  dateRange: string;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({
    status: 'all',
    type: 'all',
    chain: 'all',
    dateRange: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        ...filters,
        sort: sortOrder,
      });
      const res = await fetch(`/api/transactions?${queryParams}`);
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
  }, [searchQuery, filters, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <Button 
          onClick={fetchTransactions}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by token ID, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="LOCK_AND_MINT">Lock and Mint</SelectItem>
            <SelectItem value="BURN_AND_UNLOCK">Burn and Unlock</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.dateRange}
          onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Card 
              key={tx.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => setSelectedTx(tx)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{tx.type}</CardTitle>
                  <CardDescription>
                    Token ID: {tx.tokenId} • {formatDate(tx.timestamp)}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(tx.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(tx.status)}
                    {tx.status}
                  </div>
                </Badge>
              </CardHeader>
              <CardContent className="text-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">From Chain:</span> {tx.sourceChain}
                </div>
                <div>
                  <span className="text-gray-500">To Chain:</span> {tx.targetChain}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTx && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Transaction Details</span>
                  <Badge className={getStatusColor(selectedTx.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedTx.status)}
                      {selectedTx.status}
                    </div>
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selectedTx.timestamp)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Transaction Type</h3>
                    <p>{selectedTx.type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Token ID</h3>
                    <p>{selectedTx.tokenId}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Chain Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Source Chain</p>
                      <p>{selectedTx.sourceChain}</p>
                      <p className="text-xs text-gray-500 mt-1">Contract:</p>
                      <p className="text-sm font-mono break-all">{selectedTx.sourceContract}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Target Chain</p>
                      <p>{selectedTx.targetChain}</p>
                      <p className="text-xs text-gray-500 mt-1">Contract:</p>
                      <p className="text-sm font-mono break-all">{selectedTx.targetContract}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Transaction Hashes</h3>
                  <div className="space-y-2">
                    {selectedTx.lockHash && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="text-sm">Lock Hash:</span>
                        <code className="text-sm font-mono">{selectedTx.lockHash}</code>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {selectedTx.mintHash && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="text-sm">Mint Hash:</span>
                        <code className="text-sm font-mono">{selectedTx.mintHash}</code>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {selectedTx.burnHash && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="text-sm">Burn Hash:</span>
                        <code className="text-sm font-mono">{selectedTx.burnHash}</code>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {selectedTx.unlockHash && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="text-sm">Unlock Hash:</span>
                        <code className="text-sm font-mono">{selectedTx.unlockHash}</code>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}