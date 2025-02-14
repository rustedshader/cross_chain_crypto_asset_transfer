// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MintingBridge is ERC721, ReentrancyGuard, Ownable {
    // Prevent replay by tracking minted tokens.
    mapping(uint256 => bool) public mintedTokens;

    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenBurned(address indexed from, uint256 indexed tokenId);

    constructor() ERC721("BridgedNFT", "bNFT") {}

    // Mint a token on Chain B after a token is locked on Chain A.
    // In a production system, you would verify off-chain proofs or signatures.
    function mintToken(uint256 tokenId, address to) external nonReentrant {
        require(!mintedTokens[tokenId], "Token already minted");
        mintedTokens[tokenId] = true;
        _mint(to, tokenId);
        emit TokenMinted(to, tokenId);
    }

    // Burn the token on Chain B when bridging back to Chain A.
    function burnToken(uint256 tokenId) external nonReentrant {
        require(mintedTokens[tokenId], "Token not minted");
        require(ownerOf(tokenId) == msg.sender, "Caller is not token owner");
        mintedTokens[tokenId] = false;
        _burn(tokenId);
        emit TokenBurned(msg.sender, tokenId);
    }
}
