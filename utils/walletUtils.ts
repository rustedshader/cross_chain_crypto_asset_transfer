import { Token } from "@/types/walletTypes";
import { BrowserProvider, Contract, EtherscanProvider, formatUnits } from "ethers";
import {ethers} from "ethers";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Token addresses by network
const TOKEN_ADDRESSES = {
  // Ethereum Mainnet Tokens (Verified addresses)
  mainnet: {
    // Stablecoins
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    // DeFi Tokens
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    AAVE: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    // Popular Tokens
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    MATIC: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    SHIB: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  },
  // Sepolia Testnet Tokens (Example test tokens)
  sepolia: {
    USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
    USDC: "0xda9d4f9b69ac6C22e444eD9aF0CfC043b7a7f53f",
    DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6",
    LINK: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  },
  // Arbitrum Sepolia Testnet (Verify with official sources)
  arbitrum_sepolia: {
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    DAI: "0xc5db68F30D21cBe0C9Eac7BE5eA83468d69297e6",
    LINK: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
  },
  // Optimism Sepolia Testnet (Verify with official sources)
  optimism_sepolia: {
    USDC: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    DAI: "0x0fa8781a83c1679c22e5573d0c982033a2CCF685",
    LINK: "0x4969c0eC20371b7b629e5A56B6Fe55c4F6B659Af",
  },

  //amoy
  amoy: {
    POL: "0x0000000000000000000000000000000000001010",
  },
};

//Mapping of token symbols to CoinCap asset IDs
const COINCAP_IDS: { [symbol: string]: string } = {
      ETH: "ethereum",
      USDT: "tether",
      USDC: "usd-coin",
      DAI: "dai",
      UNI: "uniswap",
      AAVE: "aave",
      LINK: "chainlink",
      WBTC: "wrapped-bitcoin",
      MATIC: "matic-network",
      SHIB: "shiba-inu",
      POL: "polygon-ecosystem-token",
    };

export async function fetchTokenBalances(
  provider: BrowserProvider,
  address: string
) {
  try {
    // Get network to determine which token addresses to use
    const network = await provider.getNetwork();
    const chainId = network.chainId; // In ethers v6, chainId is a BigInt.
    // If using ethers v5, chainId is a number so remove the "n" suffix from below comparisons.
    // console.log("chainId", chainId);
    // Get native token (ETH) balance
    const ethBalance = await provider.getBalance(address);
    const formattedEthBalance = formatUnits(ethBalance, 18);

    // Initialize tokens array with ETH
    let tokens:Token[] = [];

    // Determine which network's tokens to use based on chainId
    let networkTokens;
    let networkChain;
    if (chainId === BigInt(1)) {
      networkTokens = TOKEN_ADDRESSES.mainnet;
      networkChain = "mainnet";
    } else if (chainId === BigInt(11155111)) {
      // Sepolia
      networkTokens = TOKEN_ADDRESSES.sepolia;
      networkChain = "sepolia";
    } else if (chainId === BigInt(421614)) {
      // Arbitrum Sepolia (verify chain ID)
      networkTokens = TOKEN_ADDRESSES.arbitrum_sepolia;
      networkChain = "arbitrum_sepolia";
    } else if (chainId === BigInt(11155420)) {
      // Optimism Sepolia
      networkTokens = TOKEN_ADDRESSES.optimism_sepolia;
      networkChain = "optimism_sepolia";
    } else if (chainId === BigInt(80002)) {
      networkTokens = TOKEN_ADDRESSES.amoy;
      networkChain = "amoy";
    } else {
      console.log("Network not supported for token fetching");
      return tokens;
    }
    // Fetch balances for each token
    const tokenPromises = Object.entries(networkTokens).map(
      async ([symbol, tokenAddress]) => {
        try {
          const contract = new Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);

          
          const decimals = await contract.decimals();
          const formattedBalance = formatUnits(balance, decimals);

          // Only add tokens with non-zero balance
          if (balance > BigInt(0)) {
            return {
              network: networkChain,
              symbol,
              balance: ((Math.round(parseFloat(formattedBalance) * 10000) / 10000)).toString(),
              usdValue: "0", // Price data can be fetched from an external API if needed
              address: tokenAddress,
            };
          }
        } catch (error) {
          console.error(`Error fetching ${symbol} balance:`, error);
        }
        return null;
      }
    );

    const tokenResults = await Promise.all(tokenPromises);
    const validTokens = tokenResults.filter((token) => token !== null);
    tokens.push(...validTokens);

    /// For each token with a CoinCap mapping, fetch the USD price
    const pricePromises = tokens.map(async token => {
      const id = COINCAP_IDS[token.symbol];
      if (id) {
        try {
          const response = await fetch(`https://api.coincap.io/v2/assets/${id}`);
          const data = await response.json();
          if (data && data.data && data.data.priceUsd) {
            const price = parseFloat(data.data.priceUsd);
            const balanceNum = parseFloat(token.balance);
            token.usdValue = (balanceNum * price).toFixed(2);
          }
        } catch (error) {
          console.error(`Error fetching price for ${token.symbol}:`, error);
        }
      }
      return token;
    });

    tokens = await Promise.all(pricePromises);

    // console.log("Tokens-------->", tokens);
    return tokens;
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return [];
  }
}

export async function fetchTransactionsFromEtherscan(address:string) {
  const apiKey = "BZPT2V7HFZHCE3PSRM6GSVGSKX3GJ74X8U"; // Replace with your API key
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1") {
      const transactions = data.result.map((tx:any) => ({
        hash: tx.hash,
        type: tx.from.toLowerCase() === address.toLowerCase() ? "sent" : "received",
        amount: `${formatUnits(tx.value, 18)} ETH`,
        timestamp: Number(tx.timeStamp) * 1000
      }));

      // Return transactions sorted by timestamp descending
      return transactions.sort((a:any, b:any) => b.timestamp - a.timestamp);
    } else {
      console.error("Etherscan API error:", data.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching transactions from Etherscan:", error);
    return [];
  }
}
