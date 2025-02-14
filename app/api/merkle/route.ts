
import { NextResponse } from 'next/server';
import { keccak256 } from 'ethers'; // For hashing
import { MerkleTree } from 'merkletreejs'; // For Merkle Tree
import { createClient } from '@/utils/supabase';

export async function GET(request: Request) {
    

  try {
    const supabase = await createClient();
    // Fetch all users using the admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    console.log(users);

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

    // Get Merkle root
    const merkleRoot = merkleTree.getHexRoot();

    // Return the Merkle root
    return NextResponse.json({ merkleRoot });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}