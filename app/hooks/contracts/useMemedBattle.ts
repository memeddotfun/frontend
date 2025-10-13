import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { BATTLE_ADDRESS } from "@/config/contracts";
import memedBattleAbi from "@/abi/memedBattle.json";

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
 * Hook for the `challengeBattle` write function.
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
