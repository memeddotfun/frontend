import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { BATTLE_ADDRESS } from "@/config/contracts";
import { memedBattleAbi } from "@/abi";

/**
 * Hook to read all battles from the MemedBattle contract.
 */
export function useGetBattles() {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getBattles",
  });
}

/**
 * Hook to read a single battle's data.
 * @param battleId The ID of the battle to fetch.
 */
export function useGetBattle(battleId: bigint) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getBattle",
    args: [battleId],
    query: {
      enabled: !!battleId,
    },
  });
}

/**
 * Hook to get all battles for a specific token address.
 * Returns battles where the token is either memeA or memeB.
 * @param tokenAddress The address of the meme token
 */
export function useGetUserBattles(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getUserBattles",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });
}

/**
 * Hook to get the battle cooldown status for a token.
 * Returns cooldown data: {onBattle: bool, cooldownEndTime: uint256}
 * @param tokenAddress The address of the meme token
 */
export function useGetBattleCooldown(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "battleCooldowns",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
      refetchInterval: 5000, // Refetch every 5 seconds for live updates
    },
  });
}

/**
 * Hook to read the BATTLE_COOLDOWN constant from the contract.
 * Returns the cooldown duration in seconds.
 */
export function useGetBattleCooldownDuration() {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "BATTLE_COOLDOWN",
  });
}

/**
 * Hook to read the BATTLE_DURATION constant from the contract.
 * Returns the battle duration in seconds.
 */
export function useGetBattleDuration() {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "BATTLE_DURATION",
  });
}

/**
 * Hook for the `challengeBattle` write function.
 * Creates a new battle challenge between two meme tokens.
 */
export function useChallengeBattle() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const challengeBattle = (memeA: `0x${string}`, memeB: `0x${string}`) => {
    writeContract({
      address: BATTLE_ADDRESS,
      abi: memedBattleAbi,
      functionName: "challengeBattle",
      args: [memeA, memeB],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { challengeBattle, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook for the `acceptOrRejectBattle` write function.
 * Accepts or rejects a pending battle challenge.
 * @returns Function to accept/reject a battle and transaction states
 */
export function useAcceptBattle() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const acceptBattle = (battleId: bigint, accept: boolean = true) => {
    writeContract({
      address: BATTLE_ADDRESS,
      abi: memedBattleAbi,
      functionName: "acceptOrRejectBattle",
      args: [battleId, accept],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { acceptBattle, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook for the `allocateNFTsToBattle` write function.
 */
export function useAllocateNftsToBattle() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type AllocateArgs = {
    battleId: bigint;
    user: `0x${string}`;
    supportedMeme: `0x${string}`;
    nftsIds: bigint[];
  };

  const allocateNfts = (args: AllocateArgs) => {
    writeContract({
      address: BATTLE_ADDRESS,
      abi: memedBattleAbi,
      functionName: "allocateNFTsToBattle",
      args: [args.battleId, args.user, args.supportedMeme, args.nftsIds],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { allocateNfts, isPending, isConfirming, isConfirmed, hash, error };
}

// ============================================================================
// USER BATTLE REWARDS HOOKS (VIEW ONLY - CLAIMS GO THROUGH ENGAGEMENT CONTRACT)
// ============================================================================

/**
 * Hook to get user's claimable rewards for a specific token across all battles.
 * This is VIEW ONLY - shows expected/pending rewards.
 * Actual claiming is done through the EngageToEarn contract.
 * @param userAddress The address of the user
 * @param tokenAddress The address of the meme token
 */
export function useGetUserClaimableRewards(
  userAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getUserClaimableRewards",
    args:
      userAddress && tokenAddress
        ? [userAddress, tokenAddress]
        : undefined,
    query: {
      enabled: !!userAddress && !!tokenAddress,
      refetchInterval: 5000, // Refetch every 5 seconds for live updates
    },
  });
}

/**
 * Hook to get all claimable battles for a user.
 * Returns arrays of battle IDs, rewards, and total reward amount.
 * This is VIEW ONLY - shows expected/pending rewards.
 * @param userAddress The address of the user
 */
export function useGetUserClaimableBattles(
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getUserClaimableBattles",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 5000,
    },
  });
}

/**
 * Hook to get claimable reward for a specific battle.
 * This is VIEW ONLY - shows expected/pending reward for one battle.
 * @param battleId The ID of the battle
 * @param userAddress The address of the user (optional, defaults to connected wallet)
 */
export function useGetUserClaimableReward(
  battleId: bigint | undefined,
  userAddress?: `0x${string}`
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = userAddress || connectedAddress;

  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getUserClaimableReward",
    args: battleId && addressToQuery ? [battleId, addressToQuery] : undefined,
    query: {
      enabled: !!battleId && !!addressToQuery,
    },
  });
}

/**
 * Hook to get battle allocation details for a user in a specific battle.
 * Returns UserBattleAllocation struct including NFT IDs, claimed status, and getBack flag.
 * @param battleId The ID of the battle
 * @param userAddress The address of the user
 * @param memeAddress The address of the supported meme token
 */
export function useGetBattleAllocations(
  battleId: bigint | undefined,
  userAddress: `0x${string}` | undefined,
  memeAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getBattleAllocations",
    args:
      battleId && userAddress && memeAddress
        ? [battleId, userAddress, memeAddress]
        : undefined,
    query: {
      enabled: !!battleId && !!userAddress && !!memeAddress,
    },
  });
}

/**
 * Hook to check if a specific NFT is returnable and get its accumulated rewards.
 * Returns tuple of [reward amount, is returnable].
 * @param tokenAddress The address of the meme token
 * @param nftId The ID of the NFT to check
 */
export function useGetNftRewardAndIsReturnable(
  tokenAddress: `0x${string}` | undefined,
  nftId: bigint | undefined
) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getNftRewardAndIsReturnable",
    args: tokenAddress && nftId ? [tokenAddress, nftId] : undefined,
    query: {
      enabled: !!tokenAddress && !!nftId,
    },
  });
}
