// File: contracts/MerkleVerifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MerkleProof.sol";

contract MerkleVerifier {
    using MerkleProof for bytes32[];

    // The current Merkle root. In production, restrict who can update this.
    bytes32 public merkleRoot;

    event MerkleRootUpdated(bytes32 newRoot);

    function setMerkleRoot(bytes32 _merkleRoot) external {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    /// @notice Verifies that a leaf is part of the Merkle tree with the stored root.
    function verifyProof(bytes32[] calldata proof, bytes32 leaf) external view returns (bool) {
        return proof.verify(merkleRoot, leaf);
    }
}
