// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract LockingBridge is ReentrancyGuard, Ownable {
    // Tracks whether a token is locked.
    mapping(uint256 => bool) public lockedTokens;
    // Stores the original owner of a locked token.
    mapping(uint256 => address) public originalOwner;

    // Immutable NFT contract for gas optimization.
    IERC721 public immutable nftContract;

    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event TokenLocked(address indexed owner, uint256 indexed tokenId);
    event TokenUnlocked(address indexed owner, uint256 indexed tokenId);

    constructor(address _nftContract) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = IERC721(_nftContract);
    }

    // Mint a token on Chain A.
    // In production, proper access control and mint logic should be applied.
    function mint(address to, uint256 tokenId) external nonReentrant {
        // The actual minting logic would depend on your NFT implementation.
        // Here we simply emit an event for off-chain relayers to verify.
        emit TokenMinted(to, tokenId);
    }

    // Lock a token before bridging to Chain B.
    function lockToken(uint256 tokenId, address user) external nonReentrant {
        require(!lockedTokens[tokenId], "Token already locked");
        require(nftContract.ownerOf(tokenId) == user, "You don't own this token");

        lockedTokens[tokenId] = true;
        originalOwner[tokenId] = user;

        // Optionally: Transfer the token to this contract for custody.
        // nftContract.transferFrom(user, address(this), tokenId);

        emit TokenLocked(user, tokenId);
    }

    // Unlock a token after it has been bridged back.
    function unlockToken(uint256 tokenId) external nonReentrant {
        require(lockedTokens[tokenId], "Token not locked");
        address owner = originalOwner[tokenId];
        require(msg.sender == owner, "Caller is not token owner");

        lockedTokens[tokenId] = false;
        originalOwner[tokenId] = address(0);

        // Optionally: Transfer the token back to the owner if it was held by the contract.
        // nftContract.transferFrom(address(this), owner, tokenId);

        emit TokenUnlocked(owner, tokenId);
    }
}
