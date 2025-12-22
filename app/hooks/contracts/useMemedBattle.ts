import {
  useAccount,
  useReadContract,
  useReadContracts,
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
    supportedMeme: `0x${string}`;
    nftsIds: bigint[];
  };

  const allocateNfts = (args: AllocateArgs) => {
    writeContract({
      address: BATTLE_ADDRESS,
      abi: memedBattleAbi,
      functionName: "allocateNFTsToBattle",
      args: [args.battleId, args.supportedMeme, args.nftsIds],
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
      battleId !== undefined && userAddress && memeAddress
        ? [battleId, userAddress, memeAddress]
        : undefined,
    query: {
      enabled: battleId !== undefined && !!userAddress && !!memeAddress,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });
}

/**
 * Hook to get an NFT's accumulated battle rewards.
 * @param tokenAddress The address of the meme token
 * @param nftId The ID of the NFT to check
 */
export function useGetNftReward(
  tokenAddress: `0x${string}` | undefined,
  nftId: bigint | undefined
) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getNftReward",
    args: tokenAddress && nftId ? [tokenAddress, nftId] : undefined,
    query: {
      enabled: !!tokenAddress && !!nftId,
    },
  });
}

/**
 * Hook to get battle scores from the contract.
 * Returns the calculated scores for both memes in a battle.
 * @param battleId The ID of the battle to get scores for
 * @returns {
 *   scoreA: Final score for meme A,
 *   scoreB: Final score for meme B,
 *   heatScoreA: Heat component for A,
 *   heatScoreB: Heat component for B,
 *   valueScoreA: NFT value component for A,
 *   valueScoreB: NFT value component for B
 * }
 */
export function useGetBattleScore(battleId: bigint | undefined) {
  return useReadContract({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getBattleScore",
    args: battleId !== undefined ? [battleId] : undefined,
    query: {
      enabled: battleId !== undefined,
      refetchInterval: 5000, // Refetch every 5 seconds for live score updates
    },
  });
}

/**
 * Interface for battle score data from contract
 */
export interface BattleScoreData {
  scoreA: bigint;
  scoreB: bigint;
  heatScoreA: bigint;
  heatScoreB: bigint;
  valueScoreA: bigint;
  valueScoreB: bigint;
}

/**
 * Hook to batch fetch battle scores for multiple battles using multicall.
 * This is more efficient than calling useGetBattleScore individually for each battle.
 * @param battleIds Array of battle IDs to fetch scores for
 * @returns Map of battleId -> BattleScoreData
 */
export function useGetBattleScoresBatch(battleIds: bigint[]) {
  // Build contract calls for each battle
  const contracts = battleIds.map((battleId) => ({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "getBattleScore" as const,
    args: [battleId] as const,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: battleIds.length > 0,
      refetchInterval: 5000, // Refetch every 5 seconds for live score updates
    },
  });

  // Build a map of battleId -> score data for easy lookup
  const scoresMap: Record<string, BattleScoreData> = {};
  
  if (data) {
    battleIds.forEach((battleId, index) => {
      const result = data[index];
      if (result && result.status === "success" && result.result) {
        // Result is a tuple: [scoreA, scoreB, heatScoreA, heatScoreB, valueScoreA, valueScoreB]
        const scoreData = result.result as readonly [bigint, bigint, bigint, bigint, bigint, bigint];
        scoresMap[battleId.toString()] = {
          scoreA: scoreData[0],
          scoreB: scoreData[1],
          heatScoreA: scoreData[2],
          heatScoreB: scoreData[3],
          valueScoreA: scoreData[4],
          valueScoreB: scoreData[5],
        };
      }
    });
  }

  return { scoresMap, isLoading, error, refetch };
}

/**
 * Hook to batch check if multiple NFTs are currently in a battle.
 * Uses multicall for efficiency when checking multiple NFTs.
 * @param tokenAddress The token address (warrior NFT contract)
 * @param nftIds Array of NFT IDs to check
 * @returns Map of nftId -> boolean (true if in battle)
 */
export function useIsNftOnBattleBatch(tokenAddress: `0x${string}` | undefined, nftIds: bigint[]) {
  // Build contract calls for each NFT
  const contracts = nftIds.map((nftId) => ({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "isNftOnBattle" as const,
    args: [tokenAddress!, nftId] as const,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!tokenAddress && nftIds.length > 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  // Build a map of nftId -> isInBattle for easy lookup
  const inBattleMap: Record<string, boolean> = {};
  
  if (data) {
    nftIds.forEach((nftId, index) => {
      const result = data[index];
      if (result && result.status === "success") {
        inBattleMap[nftId.toString()] = result.result as boolean;
      }
    });
  }

  return { inBattleMap, isLoading, error, refetch };
}

/**
 * Hook to batch check if multiple NFTs are allocatable to a battle.
 * Uses multicall for efficiency when checking multiple NFTs.
 * @param tokenAddress The token address (warrior NFT contract)
 * @param nftIds Array of NFT IDs to check
 * @returns Map of nftId -> boolean (true if allocatable)
 */
export function useIsAllocatableBatch(tokenAddress: `0x${string}` | undefined, nftIds: bigint[]) {
  // Build contract calls for each NFT
  const contracts = nftIds.map((nftId) => ({
    address: BATTLE_ADDRESS,
    abi: memedBattleAbi,
    functionName: "isAllocatable" as const,
    args: [tokenAddress!, nftId] as const,
  }));

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!tokenAddress && nftIds.length > 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  // Build a map of nftId -> isAllocatable for easy lookup
  const allocatableMap: Record<string, boolean> = {};
  
  if (data) {
    nftIds.forEach((nftId, index) => {
      const result = data[index];
      if (result && result.status === "success") {
        allocatableMap[nftId.toString()] = result.result as boolean;
      }
    });
  }

  return { allocatableMap, isLoading, error, refetch };
}
