// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract MintingContractB is ERC721, Ownable {
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed receiver,
        uint256 timestamp
    );

    event TokenBurned(
        uint256 indexed tokenId,
        uint256 timestamp
    );

    mapping(uint256 => bool) public mintedTokens;
    
    constructor() ERC721("MintingContractB", "MTKB") Ownable(msg.sender) {}

    function mintToken(uint256 tokenId, address receiver) external onlyOwner {
        require(!mintedTokens[tokenId], "Token already minted");
        _mint(receiver, tokenId);
        mintedTokens[tokenId] = true;
        emit TokenMinted(tokenId, receiver, block.timestamp);
    }

    function burnToken(uint256 tokenId) external onlyOwner {
        require(mintedTokens[tokenId], "Token does not exist");
        _burn(tokenId);
        mintedTokens[tokenId] = false;
        emit TokenBurned(tokenId, block.timestamp);
    }
}