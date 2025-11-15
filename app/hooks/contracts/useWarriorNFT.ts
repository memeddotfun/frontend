import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { memedWarriorNFTAbi } from "@/abi";

/**
 * Hook to get current mint price from warrior NFT contract.
 * Price is dynamic and increases with each mint.
 * Returns price in wei (claimed token decimals).
 *
 * @param nftAddress The warrior NFT contract address
 * @returns Current mint price in wei
 */
export function useGetCurrentPrice(nftAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "getCurrentPrice",
    query: {
      enabled: !!nftAddress,
      refetchInterval: 5000, // Price changes with each mint, so poll frequently
    },
  });
}

/**
 * Hook to get the payment token address from warrior NFT contract.
 * This is the claimed token (MEME) that users received from fair launch.
 * Users must use this token to pay for minting warriors.
 *
 * @param nftAddress The warrior NFT contract address
 * @returns Payment token (MEME) contract address
 */
export function useGetMemedToken(nftAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "memedToken",
    query: {
      enabled: !!nftAddress,
    },
  });
}

/**
 * Hook to get user's warrior NFT balance.
 * Returns how many warrior NFTs the user owns.
 *
 * @param nftAddress The warrior NFT contract address
 * @param userAddress The user's wallet address (defaults to connected wallet)
 * @returns Number of warrior NFTs owned by user
 */
export function useWarriorBalance(
  nftAddress: `0x${string}` | undefined,
  userAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: nftAddress,
    abi: memedWarriorNFTAbi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!nftAddress && !!userAddress,
      refetchInterval: 5000, // Poll to catch new mints
    },
  });
}

/**
 * Hook to mint a warrior NFT.
 *
 * IMPORTANT: mintWarrior() takes NO parameters!
 * - Price is determined by contract's getCurrentPrice()
 * - User must have approved token spending first
 * - Payment is in claimed tokens (MEME)
 *
 * @param nftAddress The warrior NFT contract address
 * @returns Mint function and transaction states
 */
export function useMintWarrior(nftAddress: `0x${string}` | undefined) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const mintWarrior = () => {
    if (!nftAddress) return;
    writeContract({
      address: nftAddress,
      abi: memedWarriorNFTAbi,
      functionName: "mintWarrior",
      // NO ARGS - mint function takes no parameters!
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    mintWarrior,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}
