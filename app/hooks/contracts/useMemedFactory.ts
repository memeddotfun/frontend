import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FACTORY_ADDRESS } from "@/config/contracts";
import factoryAbi from "@/abi/factory.json";

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
    name: string;
    ticker: string;
    description: string;
    image: string;
  };

  const startFairLaunch = (args: StartFairLaunchArgs) => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "startFairLaunch",
      args: [
        args.creator,
        args.name,
        args.ticker,
        args.description,
        args.image,
      ],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { startFairLaunch, isPending, isConfirming, isConfirmed, hash, error };
}

// You can add more hooks for other contract functions here.
// For example, a hook to get a single token by ID:
/*
export function useGetTokenById(tokenId: bigint) {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: 'getTokenById',
    args: [tokenId],
    // Enable/disable the query based on whether tokenId is provided
    query: {
      enabled: !!tokenId,
    },
  });
}
*/
