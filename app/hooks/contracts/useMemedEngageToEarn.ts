import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ENGAGE_TO_EARN_ADDRESS } from "@/config/contracts";
import memedEngageToEarnAbi from "@/abi/memedEngageToEarn.json";

/**
 * Hook to read a user's engagement reward for a specific token.
 * @param tokenAddress The address of the token.
 * @param userAddress The address of the user (optional, defaults to connected wallet).
 */
export function useGetUserEngagementReward(
  tokenAddress: `0x${string}`,
  userAddress?: `0x${string}`,
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = userAddress || connectedAddress;

  return useReadContract({
    address: ENGAGE_TO_EARN_ADDRESS,
    abi: memedEngageToEarnAbi,
    functionName: "getUserEngagementReward",
    args: [addressToQuery, tokenAddress],
    query: {
      enabled: !!tokenAddress && !!addressToQuery,
    },
  });
}

/**
 * Hook for the `registerEngagementReward` write function.
 */
export function useRegisterEngagementReward() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const registerEngagementReward = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: ENGAGE_TO_EARN_ADDRESS,
      abi: memedEngageToEarnAbi,
      functionName: "registerEngagementReward",
      args: [tokenAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    registerEngagementReward,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

/**
 * Hook for the `claimEngagementReward` write function.
 */
export function useClaimEngagementReward() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const claimEngagementReward = (rewardId: bigint) => {
    writeContract({
      address: ENGAGE_TO_EARN_ADDRESS,
      abi: memedEngageToEarnAbi,
      functionName: "claimEngagementReward",
      args: [rewardId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    claimEngagementReward,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}
