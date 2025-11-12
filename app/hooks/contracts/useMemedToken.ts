import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { memedTokenAbi } from "@/abi/memedToken";

// Note: MemedToken is a dynamic contract, so its address is not fixed.
// The address will be passed dynamically to the hooks.

/**
 * Hook to read the balance of a specific MemedToken for an account.
 * @param tokenAddress The address of the MemedToken contract.
 * @param accountAddress The address of the account to query.
 */
export function useMemedTokenBalance(
  tokenAddress: `0x${string}`,
  accountAddress?: `0x${string}`,
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = accountAddress || connectedAddress;

  return useReadContract({
    address: tokenAddress,
    abi: memedTokenAbi,
    functionName: "balanceOf",
    args: [addressToQuery ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!tokenAddress && !!addressToQuery,
    },
  });
}

/**
 * Hook to read the allowance of a spender for a specific MemedToken.
 * @param tokenAddress The address of the MemedToken contract.
 * @param ownerAddress The address of the token owner.
 * @param spenderAddress The address of the spender.
 */
export function useMemedTokenAllowance(
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
) {
  return useReadContract({
    address: tokenAddress,
    abi: memedTokenAbi,
    functionName: "allowance",
    args: [ownerAddress, spenderAddress],
    query: {
      enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress,
    },
  });
}

/**
 * Hook for the `approve` write function on a MemedToken contract.
 */
export function useMemedTokenApprove(tokenAddress: `0x${string}`) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type ApproveArgs = {
    spender: `0x${string}`;
    value: bigint;
  };

  const approve = (args: ApproveArgs) => {
    writeContract({
      address: tokenAddress,
      abi: memedTokenAbi,
      functionName: "approve",
      args: [args.spender, args.value],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { approve, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook for the `transfer` write function on a MemedToken contract.
 */
export function useMemedTokenTransfer(tokenAddress: `0x${string}`) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type TransferArgs = {
    to: `0x${string}`;
    value: bigint;
  };

  const transfer = (args: TransferArgs) => {
    writeContract({
      address: tokenAddress,
      abi: memedTokenAbi,
      functionName: "transfer",
      args: [args.to, args.value],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { transfer, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook for the `claimCreatorIncentives` write function on a MemedToken contract.
 */
export function useClaimCreatorIncentives(tokenAddress: `0x${string}`) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const claimCreatorIncentives = () => {
    writeContract({
      address: tokenAddress,
      abi: memedTokenAbi,
      functionName: "claimCreatorIncentives",
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    claimCreatorIncentives,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}
