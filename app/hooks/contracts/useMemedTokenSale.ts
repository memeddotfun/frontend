import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { TOKEN_SALE_ADDRESS } from "@/config/contracts";
import memedTokenSaleAbi from "@/abi/memedTokenSale.json";

/**
 * Hook to read data for a specific fair launch.
 * @param launchId The ID of the fair launch.
 */
export function useGetFairLaunchData(launchId: bigint) {
  return useReadContract({
    address: TOKEN_SALE_ADDRESS,
    abi: memedTokenSaleAbi,
    functionName: "getFairLaunchData",
    args: [launchId],
    query: {
      enabled: !!launchId,
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
    args: [launchId, addressToQuery],
    query: {
      enabled: !!launchId && !!addressToQuery,
    },
  });
}

/**
 * Hook for the `commitToFairLaunch` write function.
 * This is a payable function used to commit funds to a token sale.
 */
export function useCommitToFairLaunch() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type CommitToFairLaunchArgs = {
    launchId: bigint;
    value: bigint; // For the payable amount (msg.value)
  };

  const commitToFairLaunch = (args: CommitToFairLaunchArgs) => {
    writeContract({
      address: TOKEN_SALE_ADDRESS,
      abi: memedTokenSaleAbi,
      functionName: "commitToFairLaunch",
      args: [args.launchId],
      value: args.value,
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
