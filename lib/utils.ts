import { ContractError } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function decodeError(error: ContractError): string {
  if (error.data?.reason) return error.data.reason;
  if (error.reason) return error.reason;
  if (error.message?.includes("user denied")) return "Transaction rejected by user";
  return "Unknown error occurred";
}

export function getExplorerLink(hash: string, chainId: string): string {
  const baseUrl = chainId === "0x13882" 
    ? "https://amoy.polygonscan.com/tx/"
    : "https://cardona-zkevm.polygonscan.com/tx/";
  return `${baseUrl}${hash}`;
}