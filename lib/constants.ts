export const CONSTANTS = {
    LOCKING_CONTRACT: "0x1abe3f0da2d21cdc1746ae60a34df93587cd0b86",
    MINTING_CONTRACT: "0x81347593e9e74e5b1aff9ccc31916e690d0c1d33",
    AMOY_CHAIN_ID: "0x13882",
    CARDONA_CHAIN_ID: "0x98a",
    AMOY_RPC_URL: "https://rpc-amoy.polygon.technology",
    CARDONA_RPC_URL: "https://rpc.cardona.zkevm-rpc.com",
    AMOY_EXPLORER_URL: "https://amoy.polygonscan.com/",
    CARDONA_EXPLORER_URL: "https://cardona-zkevm.polygonscan.com/",
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
        blockExplorerUrls: ["https://amoy.polygonscan.com"]
      },
      CARDONA: {
        chainId: "0x98a",
        chainName: "Polygon zkEVM Cardona Testnet",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        rpcUrls: ["https://rpc.cardona.zkevm-rpc.com"],
        blockExplorerUrls: ["https://cardona-zkevm.polygonscan.com"]
      }
    }
  };