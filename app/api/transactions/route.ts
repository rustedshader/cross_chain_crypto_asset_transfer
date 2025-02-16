import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type') || 'all';
  const dateRange = searchParams.get('dateRange') || 'all';
  const sort = searchParams.get('sort') || 'desc';

  try {
    // Build the where clause based on filters
    const where: any = {
      userId: user.id,
    };

    // Search functionality
    if (search) {
      where.OR = [
        { tokenId: { contains: search, mode: 'insensitive' } },
        { lockHash: { contains: search, mode: 'insensitive' } },
        { mintHash: { contains: search, mode: 'insensitive' } },
        { burnHash: { contains: search, mode: 'insensitive' } },
        { unlockHash: { contains: search, mode: 'insensitive' } },
        { sourceChain: { contains: search, mode: 'insensitive' } },
        { targetChain: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Type filter
    if (type !== 'all') {
      where.type = type;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let dateFilter: Date;

      switch (dateRange) {
        case '24h':
          dateFilter = new Date(now.setHours(now.getHours() - 24));
          break;
        case '7d':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          dateFilter = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          dateFilter = new Date(0); // Beginning of time
      }

      where.timestamp = {
        gte: dateFilter,
      };
    }

    // Fetch transactions with filters and sorting
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        timestamp: sort === 'asc' ? 'asc' : 'desc',
      },
      take: 50, // Limit to 50 transactions per page for performance
    });

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    // Add chain explorer URLs based on chain configuration
    const enrichedTransactions = transactions.map(tx => ({
      ...tx,
      explorerUrls: {
        source: getExplorerUrl(tx.sourceChain, tx.lockHash || tx.burnHash),
        target: getExplorerUrl(tx.targetChain, tx.mintHash || tx.unlockHash),
      },
    }));

    return NextResponse.json({
      transactions: enrichedTransactions,
      total,
      hasMore: total > transactions.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// Helper function to get explorer URLs based on chain
function getExplorerUrl(chain: string | null, hash: string | null): string | null {
  if (!chain || !hash) return null;

  const explorers: Record<string, string> = {
    'ethereum': 'https://etherscan.io/tx/',
    'polygon': 'https://polygonscan.com/tx/',
    'arbitrum': 'https://arbiscan.io/tx/',
    'optimism': 'https://optimistic.etherscan.io/tx/',
    // Add more chains as needed
  };

  const baseUrl = explorers[chain.toLowerCase()];
  return baseUrl ? `${baseUrl}${hash}` : null;
}

// POST endpoint for updating transaction status
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transactionId, status } = await request.json();

    // Verify that the transaction belongs to the user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update the transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
