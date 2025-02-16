export const CONSTANTS = {
    LOCKING_CONTRACT: "0xDE870F845CF20c10ea7fdB39d2EB5Ac7cC2e1F53",
    MINTING_CONTRACT: "0xA5a9750322fe9552Ee3eea2Bd3043dA15ae3646a",
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