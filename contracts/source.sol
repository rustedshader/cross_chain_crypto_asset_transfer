// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// ============ Source Chain Gateway (Deploy on Amoy) ============

contract SourceChainGateway is IERC721Receiver, ReentrancyGuard, Ownable {
    // Add constructor to initialize Ownable with the deployer's address
    constructor() Ownable(msg.sender) {}

    // Events
    event NFTLocked(
        address indexed from,
        bytes32 indexed transferId,
        address nftContract,
        uint256 tokenId
    );
    
    event NFTUnlocked(
        address indexed to,
        bytes32 indexed transferId,
        address nftContract,
        uint256 tokenId
    );

    // Struct to store NFT transfer details
    struct NFTTransfer {
        address sender;
        address nftContract;
        uint256 tokenId;
        bool processed;
    }

    // Mappings
    mapping(bytes32 => NFTTransfer) public transfers;
    mapping(bytes32 => bool) public processedTransfers;

    // Lock NFT function
    function lockNFT(
        address _nftContract,
        uint256 _tokenId,
        bytes32 _transferId
    ) external nonReentrant {
        require(!processedTransfers[_transferId], "Transfer already processed");
        require(_nftContract != address(0), "Invalid NFT contract");
        
        // Transfer NFT to this contract
        ERC721(_nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId
        );

        // Store transfer details
        transfers[_transferId] = NFTTransfer({
            sender: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            processed: true
        });

        processedTransfers[_transferId] = true;

        emit NFTLocked(msg.sender, _transferId, _nftContract, _tokenId);
    }

    // Unlock NFT function
    function unlockNFT(bytes32 _transferId) external nonReentrant {
        NFTTransfer storage transfer = transfers[_transferId];
        require(transfer.processed, "Transfer not found");
        require(transfer.sender == msg.sender, "Not the original sender");

        // Transfer NFT back to original owner
        ERC721(transfer.nftContract).safeTransferFrom(
            address(this),
            transfer.sender,
            transfer.tokenId
        );

        delete transfers[_transferId];
        delete processedTransfers[_transferId];

        emit NFTUnlocked(
            transfer.sender,
            _transferId,
            transfer.nftContract,
            transfer.tokenId
        );
    }

    // Required for IERC721Receiver
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}