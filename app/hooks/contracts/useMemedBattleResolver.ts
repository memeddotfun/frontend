import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { BATTLE_RESOLVER_ADDRESS } from "@/config/contracts";
import memedBattleResolverAbi from "@/abi/memedBattleResolver.json";

/**
 * Hook to read the list of battle IDs that are ready to be resolved.
 */
export function useGetBattlesToResolve() {
  return useReadContract({
    address: BATTLE_RESOLVER_ADDRESS,
    abi: memedBattleResolverAbi,
    functionName: "getBattleIdsToResolve",
  });
}

/**
 * Hook for the `resolveBattle` write function.
 */
export function useResolveBattle() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const resolveBattle = (battleId: bigint) => {
    writeContract({
      address: BATTLE_RESOLVER_ADDRESS,
      abi: memedBattleResolverAbi,
      functionName: "resolveBattle",
      args: [battleId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { resolveBattle, isPending, isConfirming, isConfirmed, hash, error };
}
