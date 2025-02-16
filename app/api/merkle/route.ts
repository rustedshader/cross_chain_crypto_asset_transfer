import { NextResponse } from 'next/server';
import { keccak256 } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { createAdminClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const supabase = await createAdminClient();
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const emails = users.map(user => user.email).filter(Boolean) as string[];

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No emails found' }, { status: 404 });
    }

    // Hash emails using keccak256
    const leaves = emails.map(email => keccak256(Buffer.from(email)));
    const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });
    const merkleRoot = merkleTree.getHexRoot();

    // Generate and store proofs for all emails
    const emailProofs = emails.map(email => {
      const hashedEmail = keccak256(Buffer.from(email));
      const proof = merkleTree.getProof(hashedEmail);
      return {
        email,
        proof: proof.map(x => x.data.toString('hex'))
      };
    });

    // Set all existing roots to inactive
    await prisma.merkleRoot.updateMany({
      where: { active: true },
      data: { active: false }
    });

    // Store new Merkle root and proofs in database
    const storedRoot = await prisma.merkleRoot.create({
      data: {
        root: merkleRoot,
        emails: emails,
        emailProofs: emailProofs, // Add this field to your Prisma schema
        active: true,
        description: `Merkle root generated from ${emails.length} emails`
      }
    });

    return NextResponse.json({ 
      merkleRoot,
      storedRootId: storedRoot.id,
      emailCount: emails.length
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Add a new endpoint to get the current active root
export async function GET(request: Request) {
  try {
    const activeRoot = await prisma.merkleRoot.findFirst({
      where: { active: true },
      orderBy: { timestamp: 'desc' }
    });

    if (!activeRoot) {
      return NextResponse.json({ error: 'No active Merkle root found' }, { status: 404 });
    }

    return NextResponse.json({ 
      merkleRoot: activeRoot.root,
      timestamp: activeRoot.timestamp,
      emailCount: activeRoot.emails.length
    });

  } catch (error) {
    console.error('Error fetching active root:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}