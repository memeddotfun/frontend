import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ENGAGE_TO_EARN_ADDRESS } from "@/config/contracts";
import { memedEngageToEarnAbi } from "@/abi";

/**
 * Hook to read a user's engagement rewards.
 * Returns all claimable rewards for the specified user address.
 * Pass the user's wallet address as a parameter to get their rewards.
 */
export function useGetUserEngagementReward() {
  const { address } = useAccount();
  // console.log(address);
  return useReadContract({
    address: ENGAGE_TO_EARN_ADDRESS,
    abi: memedEngageToEarnAbi,
    functionName: "getUserEngagementReward",
    account: address, // Simulates calling from this address (sets msg.sender)
    query: {
      enabled: !!address, // Only fetch when wallet is connected
      refetchInterval: 5000, // Refetch every 5 seconds
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

// ============================================================================
// CREATOR INCENTIVE HOOKS
// ============================================================================

/**
 * Hook to read creator data for a specific token
 * Returns creator address, balance, and unlocked balance
 * @param tokenAddress The address of the token
 */
export function useCreatorData(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: ENGAGE_TO_EARN_ADDRESS,
    abi: memedEngageToEarnAbi,
    functionName: "creatorData",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });
}

/**
 * Hook to check if a token creator can claim rewards
 * @param tokenAddress The address of the token
 */
export function useIsCreatorRewardable(
  tokenAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: ENGAGE_TO_EARN_ADDRESS,
    abi: memedEngageToEarnAbi,
    functionName: "isCreatorRewardable",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

/**
 * Hook for unlocking creator incentives for a token
 */
export function useUnlockCreatorIncentives() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const unlockCreatorIncentives = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: ENGAGE_TO_EARN_ADDRESS,
      abi: memedEngageToEarnAbi,
      functionName: "unlockCreatorIncentives",
      args: [tokenAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    unlockCreatorIncentives,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

/**
 * Hook for claiming creator incentives for a token
 */
export function useClaimCreatorIncentives() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const claimCreatorIncentives = (tokenAddress: `0x${string}`) => {
    writeContract({
      address: ENGAGE_TO_EARN_ADDRESS,
      abi: memedEngageToEarnAbi,
      functionName: "claimCreatorIncentives",
      args: [tokenAddress],
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
