import { NextResponse } from 'next/server';
import { keccak256 } from 'ethers'; // For hashing
import { MerkleTree } from 'merkletreejs'; // For Merkle Tree
import { createUserClient } from '@/utils/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email'); // Get the email from query parameters

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const supabase = await createUserClient();
    // Fetch all users using the admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Extract email addresses from users
    const emails = users.map(user => user.email).filter(Boolean) as string[]; // Filter out null/undefined emails

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No emails found' }, { status: 404 });
    }

    // Hash emails using keccak256
    const leaves = emails.map(email => keccak256(Buffer.from(email)));

    // Create Merkle Tree
    const merkleTree = new MerkleTree(leaves, keccak256, { sort: true });

    // Hash the provided email
    const hashedEmail = keccak256(Buffer.from(email));

    // Check if the hashed email is part of the Merkle tree
    const proof = merkleTree.getProof(hashedEmail);
    const isVerified = merkleTree.verify(proof, hashedEmail, merkleTree.getHexRoot());

    // Return the verification result
    return NextResponse.json({ isVerified });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}