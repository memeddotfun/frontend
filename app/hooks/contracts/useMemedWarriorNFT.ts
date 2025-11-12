import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { memedWarriorNFTAbi } from "@/abi/memedWarriorNFT";

// Note: MemedWarriorNFT is a dynamic contract, so its address will be passed dynamically.

/**
 * Hook to read the balance of MemedWarriorNFTs for an account.
 * @param nftAddress The address of the MemedWarriorNFT contract.
 * @param accountAddress The address of the account to query.
 */
export function useWarriorBalance(
  nftAddress: `0x${string}`,
  accountAddress?: `0x${string}`,
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = accountAddress || connectedAddress;

  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "balanceOf",
    args: [addressToQuery ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!nftAddress && !!addressToQuery,
    },
  });
}

/**
 * Hook to read the owner of a specific MemedWarriorNFT.
 * @param nftAddress The address of the MemedWarriorNFT contract.
 * @param tokenId The ID of the NFT.
 */
export function useWarriorOwner(nftAddress: `0x${string}`, tokenId: bigint) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "ownerOf",
    args: [tokenId],
    query: {
      enabled: !!nftAddress && !!tokenId,
    },
  });
}

/**
 * Hook for the `approve` write function on a MemedWarriorNFT contract.
 */
export function useWarriorApprove(nftAddress: `0x${string}`) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  type ApproveArgs = {
    spender: `0x${string}`;
    tokenId: bigint;
  };

  const approve = (args: ApproveArgs) => {
    writeContract({
      address: nftAddress,
      abi: memedWarriorNFTAbi,
      functionName: "approve",
      args: [args.spender, args.tokenId],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { approve, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook for the `mintWarrior` write function on a MemedWarriorNFT contract.
 */
export function useMintWarrior(nftAddress: `0x${string}`) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const mintWarrior = () => {
    writeContract({
      address: nftAddress,
      abi: memedWarriorNFTAbi,
      functionName: "mintWarrior",
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return { mintWarrior, isPending, isConfirming, isConfirmed, hash, error };
}

/**
 * Hook to read a user's active NFTs for a specific MemedWarriorNFT contract.
 * @param nftAddress The address of the MemedWarriorNFT contract.
 * @param userAddress The address of the user to query.
 */
export function useUserActiveNfts(
  nftAddress: `0x${string}`,
  userAddress?: `0x${string}`,
) {
  const { address: connectedAddress } = useAccount();
  const addressToQuery = userAddress || connectedAddress;

  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "getUserActiveNFTs",
    args: [addressToQuery ?? "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!nftAddress && !!addressToQuery,
    },
  });
}
