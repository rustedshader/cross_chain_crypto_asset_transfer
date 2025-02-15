// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract LockingContractA is ERC721, ReentrancyGuard, Ownable {
    event TokenLocked(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed receiver,
        uint256 timestamp
    );

    event TokenMinted(
        uint256 indexed tokenId,
        address indexed receiver,
        uint256 timestamp
    );

    event TokenUnlocked(
        uint256 indexed tokenId,
        address indexed sender,
        uint256 timestamp
    );

    mapping(uint256 => bool) public lockedTokens;
    mapping(uint256 => bool) private mintedTokens;

    constructor() ERC721("LockedTokenA", "LTA") Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) external {
        require(!mintedTokens[tokenId], "Token is already minted");
        require(tokenId > 0, "Invalid token ID");
        _mint(to, tokenId);
        mintedTokens[tokenId] = true;
        emit TokenMinted(tokenId, to, block.timestamp);
    }

    function lockToken(uint256 tokenId, address receiver) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "You do not own this token");
        require(!lockedTokens[tokenId], "Token is already locked");
        lockedTokens[tokenId] = true;
        emit TokenLocked(tokenId, msg.sender, receiver, block.timestamp);
    }

    function unlockToken(uint256 tokenId) external onlyOwner {
        require(lockedTokens[tokenId], "Token is not locked");
        lockedTokens[tokenId] = false;
        emit TokenUnlocked(tokenId, msg.sender, block.timestamp);
    }
}