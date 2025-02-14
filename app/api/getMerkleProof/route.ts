// pages/api/getMerkleProof.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

type Data = {
  proof?: string[];
  merkleRoot?: string;
  error?: string;
};

// Example whitelist of allowed leaves.
// Each entry should match the format used to compute the leaf in your frontend.
// In this example the leaf is computed as: keccak256(`${tokenId}-${userAddress}`)
const whitelist = [
  "1-0x1111111111111111111111111111111111111111",
  "2-0x2222222222222222222222222222222222222222",
  "3-0x3333333333333333333333333333333333333333",
];

// Precompute leaves from whitelist.
const leaves = whitelist.map(item => keccak256(item));
// Create the Merkle tree (ensure to sort pairs if required by your verifier contract).
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
// Get the Merkle root in hex format.
const root = tree.getHexRoot();

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { tokenId, userAddress } = req.body;

  if (!tokenId || !userAddress) {
    return res.status(400).json({ error: 'Missing tokenId or userAddress in the request body.' });
  }

  // Compute the leaf using the same format as in your frontend.
  const leafData = `${tokenId}-${userAddress}`;
  const leaf = keccak256(leafData);

  // Optionally, check if the leaf is part of your whitelist.
  const leafHex = leaf.toString('hex');
  const isWhitelisted = leaves.some(item => item.toString('hex') === leafHex);

//   if (!isWhitelisted) {
//     return res.status(400).json({ error: 'Provided tokenId and address are not in the whitelist.' });
//   }

  // Get the Merkle proof for the leaf as an array of hex strings.
  const proof = tree.getHexProof(leaf);

  return res.status(200).json({ proof, merkleRoot: root });
}
