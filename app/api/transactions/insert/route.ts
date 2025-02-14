// File: app/api/transactions/insert/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await request.json();
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: data.type,
        tokenId: data.tokenId,
        lockHash: data.lockHash,
        mintHash: data.mintHash,
        burnHash: data.burnHash,
        unlockHash: data.unlockHash,
        status: data.status,
      },
    });
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error inserting transaction:', error);
    return NextResponse.json({ error: 'Failed to insert transaction' }, { status: 500 });
  }
}
