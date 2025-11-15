import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { erc20Abi } from "viem";

/**
 * Hook to get user's balance of claimed tokens (MEME).
 * These are the tokens users received from the fair launch.
 * They use these tokens to pay for minting warrior NFTs.
 *
 * @param tokenAddress The claimed token (MEME) contract address
 * @returns User's token balance in wei
 */
export function useMemedTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
      refetchInterval: 5000, // Poll for balance updates
    },
  });
}

/**
 * Hook to check current allowance for warrior NFT contract.
 * Allowance determines how many tokens the NFT contract can spend on user's behalf.
 * User must approve before minting if allowance < mint price.
 *
 * @param tokenAddress The claimed token (MEME) contract address
 * @param spender The warrior NFT contract address
 * @returns Current allowance amount in wei
 */
export function useMemedTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && spender ? [address, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!spender && !!address,
      refetchInterval: 5000, // Poll to catch approval confirmations
    },
  });
}

/**
 * Hook to approve token spending for warrior NFT contract.
 * User must approve the NFT contract to spend their claimed tokens
 * before they can mint warriors.
 *
 * Approval flow:
 * 1. User clicks "Approve" button
 * 2. approve(nftContractAddress, mintPrice) is called
 * 3. Wait for transaction confirmation
 * 4. Allowance is updated
 * 5. User can now mint
 *
 * @param tokenAddress The claimed token (MEME) contract address
 * @returns Approve function and transaction states
 */
export function useMemedTokenApprove(tokenAddress: `0x${string}` | undefined) {
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!tokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    approve,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}
