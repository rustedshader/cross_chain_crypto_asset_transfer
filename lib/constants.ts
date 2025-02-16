export const CONSTANTS = {
    // AMOY_SOURCE_CONTRACT: "0xDE870F845CF20c10ea7fdB39d2EB5Ac7cC2e1F53",
    // BASE_SEPOLIA_SOURCE_CONTRACT: "0x82566223A41cf933445a2D89Ff7dAE409ac182e1",
    // OP_SEPOLIA_SOURCE_CONTRACT: "0x82566223a41cf933445a2d89ff7dae409ac182e1",


    // AMOY_DESTINATION_CONTRACT: "",
    // BASE_SEPOLIA_DESTINATION_CONTRACT: "0xd4aab671d7ef5872e5dc1c7dc12a190254152b7e",
    // OP_SEPOLIA_DESTINATION_CONTRACT: "0xd4aab671d7ef5872e5dc1c7dc12a190254152b7e",
    
    
    AMOY_CHAIN_ID: "0x13882",
    OP_SEPOLIA_CHAIN_ID: "0xaa37dc",
    BASE_SEPOLIA_CHAIN_ID: "0x14a34",
    
    
    AMOY_RPC_URL: "https://rpc-amoy.polygon.technology",
    BASE_SEPOLIA_RPC_URL: "https://sepolia.base.org",
    OP_SEPOLIA_RPC_URL: "https://sepolia.optimism.io",


    AMOY_EXPLORER_URL: "https://amoy.polygonscan.com/",
    BASE_SEPOLIA_EXPLORER_URL: "https://sepolia.polygonscan.com/",
    OP_SEPOLIA_EXPLORER_URL: "https://sepolia-optimism.etherscan.io/",

    AVAILABLE_CHAINS: [
      { name: "Amoy", chainId: "AMOY" },
      { name: "Base Sepolia", chainId: "BASE_SEPOLIA" },
      { name: "OP Sepolia", chainId: "OP_SEPOLIA" },
    ],


    CHAIN_CONFIG: {
      AMOY: {
        chainId: "0x13882",
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "Polygon Amoy",
          symbol: "POL",
          decimals: 18
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
        source_contract: "0x1747e261d5991112f51f4a565f517303ef45ec6a",
        destination_contract: ""
      },
      BASE_SEPOLIA: {
        chainId: "0x14a34",
        chainName: "Polygon Base Sepolia",
        nativeCurrency: {
          name: "Polygon Base Sepolia",
          symbol: "ETH",
          decimals: 18
        },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.polygonscan.com"],
        source_contract: "0x82566223A41cf933445a2D89Ff7dAE409ac182e1",
        destination_contract: "0xCAF4f8CD0b7d84Aaecf2de055B5324f42e048162"
      },
      OP_SEPOLIA: {
        chainId: "0xaa37dc",
        chainName: "OP Sepolia Testnet",
        nativeCurrency: {
          name: "OP Seplia",
          symbol: "ETH",
          decimals: 18
        },
        rpcUrls: ["https://sepolia.optimism.io"],
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io/"],
        source_contract: "0x82566223a41cf933445a2d89ff7dae409ac182e1",
        destination_contract: "0xd4aab671d7ef5872e5dc1c7dc12a190254152b7e"
      },
    }
  };