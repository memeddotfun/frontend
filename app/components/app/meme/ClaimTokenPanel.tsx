import { useState, useEffect } from "react";
import { Gift, CheckCircle } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useClaim,
  useGetUserCommitment,
} from "@/hooks/contracts/useMemedTokenSale";

/**
 * Format large numbers for display with proper decimal places and compact notation
 * @param value - The number value as a string (from formatEther)
 * @returns Formatted string with appropriate precision
 */
function formatTokenAmount(value: string): string {
  const num = parseFloat(value);

  // Handle zero and very small numbers
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";

  // For millions (1,000,000+)
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }

  // For thousands (1,000+)
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }

  // For smaller numbers, show 2 decimal places
  return num.toFixed(2);
}

interface ClaimTokenPanelProps {
  tokenId: bigint;
  tokenName?: string; // Token name for display
}

/**
 * ClaimTokenPanel Component
 *
 * Displays claim functionality for successfully launched tokens (status 3).
 * Shows user's token allocation and allows them to claim their tokens.
 */
const ClaimTokenPanel = ({ tokenId, tokenName = "Token" }: ClaimTokenPanelProps) => {
  const { address } = useAccount();

  // Get user's commitment data
  const { data: userCommitment, isLoading: isLoadingCommitment } =
    useGetUserCommitment(tokenId, address);

  // Claim hook
  const {
    claim,
    isPending: isClaiming,
    isConfirming: isConfirmingClaim,
    isConfirmed: isClaimConfirmed,
  } = useClaim();

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle success message when claim is confirmed
  useEffect(() => {
    if (isClaimConfirmed) {
      // Show success message
      setShowSuccessMessage(true);

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isClaimConfirmed]);

  const handleClaim = () => {
    claim({ id: tokenId });
  };

  // Check if user has tokens to claim
  const hasTokensToClaim =
    userCommitment &&
    userCommitment.tokenAmount > 0n &&
    !userCommitment.claimed;

  // Check if user already claimed
  const alreadyClaimed = userCommitment && userCommitment.claimed;

  // Check if user has no commitment
  const noCommitment = !userCommitment || userCommitment.amount === 0n;

  const isTransacting = isClaiming || isConfirmingClaim;

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        <Gift className="text-green-500" /> Claim {tokenName} Tokens
      </h2>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/20 border border-green-600 text-green-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">
            ✅ Claim Successful!
          </div>
          <div className="text-xs text-green-300">
            Your {tokenName} tokens have been transferred to your wallet.
          </div>
        </div>
      )}

      {/* Already Claimed Message */}
      {alreadyClaimed && (
        <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-md">
          <div className="text-sm font-medium mb-2 text-green-400 flex items-center gap-2">
            <CheckCircle size={16} />
            Tokens Already Claimed
          </div>
          <div className="text-xs text-neutral-300">
            You successfully claimed{" "}
            <span className="text-white font-medium">
              {formatTokenAmount(formatEther(userCommitment.tokenAmount))} {tokenName}
            </span>{" "}
            tokens. Check your wallet!
          </div>
        </div>
      )}

      {/* No Commitment Message */}
      {noCommitment && (
        <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-md">
          <div className="text-sm text-neutral-400 text-center">
            You don't have any tokens to claim for this launch.
          </div>
        </div>
      )}

      {/* Claim Section - Only show if user has tokens to claim */}
      {hasTokensToClaim && (
        <>
          {/* Token Allocation Display */}
          <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-md">
            <div className="text-sm font-medium mb-3 text-green-400">
              🎉 Your Token Allocation
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Tokens to Claim:</span>
                <span className="text-white font-bold text-lg">
                  {formatTokenAmount(formatEther(userCommitment.tokenAmount))} {tokenName}
                </span>
              </div>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={isTransacting || !address}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Gift size={18} />
            {isTransacting
              ? "Claiming..."
              : !address
              ? "Connect Wallet"
              : `Claim ${tokenName} Tokens`}
          </button>

          {/* Info Box */}
          <div className="bg-blue-500/20 border border-blue-600 text-blue-300 text-sm p-3 rounded-md">
            <div className="font-medium mb-1">ℹ️ Claim Info</div>
            <div className="text-xs text-blue-300 space-y-1">
              <div>• Click the button above to claim your {tokenName} tokens</div>
              <div>• Tokens will be transferred directly to your wallet</div>
              <div>• This is a one-time action - you can only claim once</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClaimTokenPanel;
