import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FACTORY_ADDRESS } from "@/config/contracts";
import { factoryAbi } from "@/abi";

/**
 * Hook to read all tokens from the MemedFactory contract.
 * This calls the `getTokens` view function.
 */
export function useGetTokens() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getTokens",
  });
}

/**
 * Hook for the `startFairLaunch` write function on the MemedFactory contract.
 * Provides a function to call the transaction, and tracks the transaction's status.
 */
export function useStartFairLaunch() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  // Type for the arguments of the startFairLaunch function
  type StartFairLaunchArgs = {
    creator: `0x${string}`;
  };

  const startFairLaunch = (args: StartFairLaunchArgs) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "startFairLaunch",
      args: [args.creator],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { startFairLaunch, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook to read a single token's data from the MemedFactory contract.
 * This calls the `tokenData` view function.
 * @param tokenId The ID of the token to fetch.
 */
export function useGetTokenData(tokenId: bigint) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "tokenData",
    args: [tokenId],
    query: {
      enabled: !!tokenId,
    },
  });
}

/**
 * Hook to get the Warrior NFT contract address for a specific token.
 * This calls the `getWarriorNFT` view function on the MemedFactory contract.
 * @param tokenAddress The address of the Memed token.
 * @returns The address of the Warrior NFT contract associated with the token.
 */
export function useGetWarriorNFT(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getWarriorNFT",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

/**
 * Hook to get the Heat score for a specific token.
 * Heat is the platform's success metric that unlocks creator incentives.
 * Formula: Every 100,000 Heat unlocks 2,000,000 tokens (Max 5,000,000/Day)
 *
 * @param tokenAddress The address of the Memed token.
 * @returns The current Heat score for the token.
 */
export function useTokenHeat(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getHeat",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 30000, // Refetch every 30 seconds for live Heat updates
    },
  });
}
