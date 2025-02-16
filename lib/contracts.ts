export const LOCKING_CONTRACT_ABI = [
  "function lockNFT(address _nftContract, uint256 _tokenId, bytes32 _transferId) external",
  "function unlockNFT(bytes32 _transferId) external",
  "function transfers(bytes32) external view returns (address sender, address nftContract, uint256 tokenId, bool processed)",
  "function processedTransfers(bytes32) external view returns (bool)",
  "function onERC721Received(address, address, uint256, bytes) external returns (bytes4)",
  "event NFTLocked(address indexed from, bytes32 indexed transferId, address nftContract, uint256 tokenId)",
  "event NFTUnlocked(address indexed to, bytes32 indexed transferId, address nftContract, uint256 tokenId)"
];

  
export const MINTING_CONTRACT_ABI = [
  "constructor(string memory name, string memory symbol)",
  "function mintWrappedNFT(address _to, address _originalContract, uint256 _tokenId, bytes32 _transferId, string _tokenURI) external",
  "function burnWrappedNFT(uint256 _tokenId, bytes32 _transferId) external",
  "function processedTransfers(bytes32) external view returns (bool)",
  "function originalContracts(uint256) external view returns (address)",
  "event WrappedNFTMinted(address indexed to, bytes32 indexed transferId, address originalContract, uint256 tokenId)",
  "event WrappedNFTBurned(address indexed from, bytes32 indexed transferId, address originalContract, uint256 tokenId)"
];



  export const NFT_CONTRACT_ABI = [
    "function approve(address to, uint256 tokenId) external",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function safeTransferFrom(address from, address to, uint256 tokenId) external"
  ];
  