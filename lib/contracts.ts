export const LOCKING_CONTRACT_ABI = [
    "function mint(address to, uint256 tokenId) external",
    "function lockToken(uint256 tokenId, address receiver) external",
    "function unlockToken(uint256 tokenId) external",
    "function lockedTokens(uint256) public view returns (bool)",
    "function ownerOf(uint256) public view returns (address)",
    "error TokenAlreadyMinted(uint256 tokenId)",
    "error TokenNotLocked(uint256 tokenId)",
    "error TokenAlreadyLocked(uint256 tokenId)",
    "error NotTokenOwner(address sender, uint256 tokenId)",
    "event TokenLocked(uint256 indexed tokenId, address indexed sender, address indexed receiver, uint256 timestamp)",
    "event TokenMinted(uint256 indexed tokenId, address indexed receiver, uint256 timestamp)",
    "event TokenUnlocked(uint256 indexed tokenId, address indexed sender, uint256 timestamp)"
  ];
  
  export const MINTING_CONTRACT_ABI = [
    "function mintToken(uint256 tokenId, address receiver) external",
    "function burnToken(uint256 tokenId) external",
    "function mintedTokens(uint256) public view returns (bool)",
    "error TokenAlreadyMinted(uint256 tokenId)",
    "error TokenDoesNotExist(uint256 tokenId)",
    "error NotAuthorized()",
    "event TokenMinted(uint256 indexed tokenId, address indexed receiver, uint256 timestamp)",
    "event TokenBurned(uint256 indexed tokenId, uint256 timestamp)"
  ];