// Helper: Fetch Merkle proof (if needed)
export async function fetchMerkleProof(
  tokenId: string,
  userAddress: string
): Promise<{ proof: string[]; merkleRoot: string } | null> {
  try {
    const res = await fetch("/api/getMerkleProof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, userAddress }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Error fetching Merkle proof:", err.error);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Error in fetchMerkleProof:", err);
    return null;
  }
}


