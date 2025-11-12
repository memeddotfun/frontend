import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { TOKEN_SALE_ADDRESS } from "@/config/contracts";
import { memedTokenSaleAbi } from "@/abi";
import { baseSepolia, base } from "wagmi/chains";

/**
 * Hook to read the status of a specific fair launch.
 * @param launchId The ID of the fair launch.
 */
export function useGetFairLaunchStatus(launchId: bigint) {
  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "getFairLaunchStatus",
    args: [launchId],
    query: {
      enabled: !!launchId,
    },
  });
}

/**
 * Hook to read full fair launch data using fairLaunchData function.
 * @param launchId The ID of the fair launch.
 */
export function useFairLaunchData(launchId: bigint) {
  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "fairLaunchData",
    args: [launchId],
    chainId: baseSepolia.id, // Force Base Sepolia since contract is deployed there
    query: {
      enabled: !!launchId && launchId >= 0n,
    },
  });
}

/**
 * Hook to read a user's commitment to a fair launch.
 * @param launchId The ID of the fair launch.
 * @param userAddress The address of the user (optional, defaults to connected wallet).
 */
export function useGetUserCommitment(
  launchId: bigint,
  userAddress?: `0x${string}`,
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = userAddress || connectedAddress;

  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "getUserCommitment",
    args: [
      launchId,
      addressToQuery ?? "0x0000000000000000000000000000000000000000",
    ],
    query: {
      enabled: !!launchId && !!addressToQuery,
    },
  });
}

/**
 * Hook for the `commitToFairLaunch` write function.
 * This function takes _id and amount as parameters.
 */
export function useCommitToFairLaunch() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type CommitToFairLaunchArgs = {
    launchId: bigint;
    amount: bigint;
  };

  const commitToFairLaunch = (args: CommitToFairLaunchArgs) => {
    writeContract({
      address: TOKEN_SALE_ADDRESS,
      abi: memedTokenSaleAbi,
      functionName: "commitToFairLaunch",
      args: [args.launchId, args.amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    commitToFairLaunch,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}



/**
 * Hook to read the fixed price per token in wei.
 */
export function usePricePerTokenWei() {
  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "PRICE_PER_TOKEN_WEI",
  });
}

/**
 * Hook to read the current ID counter from the contract.
 */
export function useCurrentId() {
  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "id",
  });
}

/**
 * Hook to check if a fair launch ID exists by checking if it's within valid range
 * @param launchId The ID to validate
 */
export function useValidateFairLaunchId(launchId: bigint) {
  const { data: currentId, isLoading } = useCurrentId();
  
  const isValid = currentId !== undefined && launchId > 0n && launchId <= currentId;
  
  return {
    isValid,
    isLoading,
    currentMaxId: currentId,
  };
}

/**
 * Hook for the `cancelCommit` write function.
 */
export function useCancelCommit() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type CancelCommitArgs = {
    id: bigint;
  };

  const cancelCommit = (args: CancelCommitArgs) => {
    writeContract({
      address: TOKEN_SALE_ADDRESS,
      abi: memedTokenSaleAbi,
      functionName: "cancelCommit",
      args: [args.id],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    cancelCommit,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}
