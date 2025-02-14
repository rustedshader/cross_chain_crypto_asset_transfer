import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Transaction data:', data);
    console.log('User:', user);

    // Add null checks for optional fields
    const transactionData = {
      userId: user.id,
      type: data.type,
      tokenId: data.tokenId,
      lockHash: data.lockHash || null,
      mintHash: data.mintHash || null,
      burnHash: data.burnHash || null,
      unlockHash: data.unlockHash || null,
      status: data.status,
    };

    console.log('Creating transaction with data:', transactionData);

    const transaction = await prisma.transaction.create({
      data: transactionData
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Error inserting transaction:', error);
    
    // More detailed error response
    return NextResponse.json({ 
      success: false,
      error: 'Failed to insert transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    });
  }
}