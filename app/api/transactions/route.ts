// File: app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        // You can extend filtering logic here using the `filter` value.
      },
      orderBy: { timestamp: 'desc' },
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
