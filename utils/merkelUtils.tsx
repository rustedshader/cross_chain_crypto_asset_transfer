// A helper function in your CrossChainBridge component
import { ethers } from 'ethers';

export async function verifyOnChainMerkleProof(
  proof: string[], // array of hex strings
  leaf: string,    // the computed leaf hash (hex string)
  verifierAddress: string
) {
  if (!window.ethereum) throw new Error('No Ethereum provider found');

  const provider = new ethers.BrowserProvider(window.ethereum);
  const verifierAbi = [
    'function verifyProof(bytes32[] calldata proof, bytes32 leaf) view returns (bool)',
  ];
  const verifierContract = new ethers.Contract(verifierAddress, verifierAbi, provider);
  const isValid = await verifierContract.verifyProof(proof, leaf);
  return isValid;
}
