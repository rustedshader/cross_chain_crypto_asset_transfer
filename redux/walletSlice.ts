"use client";

import { CONSTANTS } from "@/lib/constants";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WalletState {
  address: string;
  balance: number; // or string, depending on how you fetch it
  chain:  keyof typeof CONSTANTS.CHAIN_CONFIG;   // e.g. "amoy", "ethereum", "polygon", etc.
  isConnected: boolean;
}

const initialState: WalletState = {
  address: "",
  balance: 0,
  chain: "AMOY",     // default chain
  isConnected: false,
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWalletAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
      state.isConnected = !!action.payload;
    },
    setChain: (state, action: PayloadAction< keyof typeof CONSTANTS.CHAIN_CONFIG>) => {
      state.chain = action.payload;
    },
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    resetWallet: (state) => {
      state.address = "";
      state.balance = 0;
      state.chain = "AMOY";
      state.isConnected = false;
    },
  },
});

export const { setWalletAddress, setChain, setBalance, resetWallet } = walletSlice.actions;
export default walletSlice.reducer;
