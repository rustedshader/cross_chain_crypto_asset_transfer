import { NextResponse } from 'next/server';
import { keccak256 } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    // Get active root and proofs from database
    const activeRoot = await prisma.merkleRoot.findFirst({
      where: { active: true },
      orderBy: { timestamp: 'desc' }
    });

    if (!activeRoot) {
      return NextResponse.json({ error: 'No active Merkle root found' }, { status: 404 });
    }

    // Find proof for the given email
    const emailProof = (activeRoot.emailProofs as any[])?.find(p => p.email === email);
    
    if (!emailProof) {
      return NextResponse.json({ isVerified: false });
    }

    // Hash the provided email
    const hashedEmail = keccak256(Buffer.from(email));
    
    // Convert stored proof back to Buffer format
    const proof = emailProof.proof.map((p:string) => Buffer.from(p, 'hex'));

    // Verify using just the root and stored proof
    const isVerified = MerkleTree.verify(
      proof,
      hashedEmail,
      activeRoot.root,
      keccak256,
      { sort: true }
    );

    return NextResponse.json({ isVerified });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}