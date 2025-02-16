// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract DestinationChainGateway is ERC721URIStorage, ReentrancyGuard, Ownable {
    // Events
    event WrappedNFTMinted(
        address indexed to,
        bytes32 indexed transferId,
        address originalContract,
        uint256 tokenId
    );

    event WrappedNFTBurned(
        address indexed from,
        bytes32 indexed transferId,
        address originalContract,
        uint256 tokenId
    );

    // Mappings
    mapping(uint256 => address) public originalContracts;
    mapping(bytes32 => bool) public processedTransfers;

    constructor(string memory name, string memory symbol) 
        Ownable(msg.sender) ERC721(name, symbol) 
    {}

    // Mint wrapped NFT
    function mintWrappedNFT(
        address _to,
        address _originalContract,
        uint256 _tokenId,
        bytes32 _transferId,
        string memory _tokenURI
    ) external onlyOwner nonReentrant {
        require(!processedTransfers[_transferId], "Transfer already processed");
        
        _safeMint(_to, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);
        originalContracts[_tokenId] = _originalContract;

        processedTransfers[_transferId] = true;

        emit WrappedNFTMinted(_to, _transferId, _originalContract, _tokenId);
    }

    // Burn wrapped NFT
    function burnWrappedNFT(uint256 _tokenId, bytes32 _transferId) external nonReentrant {
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(!processedTransfers[_transferId], "Transfer already processed");
        
        address originalContract = originalContracts[_tokenId];
        require(originalContract != address(0), "Token not found");

        _burn(_tokenId);
        delete originalContracts[_tokenId];

        processedTransfers[_transferId] = true;

        emit WrappedNFTBurned(msg.sender, _transferId, originalContract, _tokenId);
    }
}