import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { PAYMENT_TOKEN_ADDRESS, TOKEN_SALE_ADDRESS } from "@/config/contracts";
import { erc20Abi } from "@/abi/erc20";

/**
 * Hook to get payment token balance
 */
export function usePaymentTokenBalance() {
  const { address } = useAccount();
  
  return useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get payment token allowance for the token sale contract
 */
export function usePaymentTokenAllowance() {
  const { address } = useAccount();
  
  return useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, TOKEN_SALE_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get payment token info (name, symbol, decimals)
 */
export function usePaymentTokenInfo() {
  const { data: name } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "name",
  });
  
  const { data: symbol } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
  });
  
  const { data: decimals } = useReadContract({
    address: PAYMENT_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
  });
  
  return { name, symbol, decimals };
}

/**
 * Hook to approve payment token spending
 */
export function useApprovePaymentToken() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const approveToken = (amount: bigint) => {
    writeContract({
      address: PAYMENT_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [TOKEN_SALE_ADDRESS, amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    approveToken,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}