// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MerkleProof.sol";

contract MerkleVerifier {
    using MerkleProof for bytes32[];

    // The current Merkle root.
    bytes32 public merkleRoot;
    address public owner;

    event MerkleRootUpdated(bytes32 newRoot);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
      require(msg.sender == owner, "Only owner can call this function");
      _;
    }

    /// @notice Updates the Merkle root. Restricted to the contract owner.
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    /// @notice Verifies that a leaf is part of the Merkle tree with the stored root.
    /// @param proof An array of sibling hashes on the branch from the leaf to the root of the Merkle tree.
    /// @param leaf The leaf hash.
    /// @return True if the leaf can be verified to be part of the Merkle tree, false otherwise.
    function verifyProof(bytes32[] calldata proof, bytes32 leaf) external view returns (bool) {
        return proof.verify(merkleRoot, leaf);
    }
}
