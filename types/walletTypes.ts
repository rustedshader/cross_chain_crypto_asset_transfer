export interface ChainInfo {
  name: string;
  chainId: string;
}

export interface Token {
  symbol: string;
  balance: string;
  usdValue: string;
  address: string;
  network: string;
}

export interface Transaction {
  type: string;
  amount: string;
  usdValue: string;
    hash: string;
    timestamp: string;
}
