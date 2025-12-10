import { useState, useEffect } from "react";
import { Gift, CheckCircle, AlertTriangle } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useClaim,
  useGetUserCommitment,
  useGetExpectedClaim,
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
 * Displays claim functionality for successfully launched tokens (status 2 = COMPLETED).
 * Shows user's token allocation and allows them to claim their tokens.
 */
const ClaimTokenPanel = ({
  tokenId,
  tokenName = "Token",
}: ClaimTokenPanelProps) => {
  const { address } = useAccount();

  // Get user's commitment data
  const { data: userCommitment, isLoading: isLoadingCommitment } =
    useGetUserCommitment(tokenId, address);

  // Get expected claim data (accounts for oversubscription)
  // Returns actual tokens user will receive + any refund amount
  const { data: expectedClaim, isLoading: isLoadingExpectedClaim } =
    useGetExpectedClaim(tokenId, address);

  // Claim hook
  const {
    claim,
    isPending: isClaiming,
    isConfirming: isConfirmingClaim,
    isConfirmed: isClaimConfirmed,
    error: claimError,
  } = useClaim();

  // State for tracking if claim process has started
  const [claimStarted, setClaimStarted] = useState(false);

  // Reset claimStarted when there's an error or when claim is confirmed
  useEffect(() => {
    if (claimError) {
      setClaimStarted(false);
    }
  }, [claimError]);

  // Reset claimStarted when claim is successfully confirmed
  useEffect(() => {
    if (isClaimConfirmed) {
      setClaimStarted(false);
    }
  }, [isClaimConfirmed]);

  // Set claimStarted when transaction begins
  useEffect(() => {
    if (isClaiming || isConfirmingClaim) {
      setClaimStarted(true);
    }
  }, [isClaiming, isConfirmingClaim]);

  // Detect when user is no longer pending but hasn't confirmed or errored
  // This handles the case where user cancels in wallet
  useEffect(() => {
    if (
      claimStarted &&
      !isClaiming &&
      !isConfirmingClaim &&
      !claimError &&
      !isClaimConfirmed
    ) {
      // Reset after a brief delay to ensure error has time to populate
      const timeoutId = setTimeout(() => {
        setClaimStarted(false);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    claimStarted,
    isClaiming,
    isConfirmingClaim,
    claimError,
    isClaimConfirmed,
  ]);

  const handleClaim = () => {
    setClaimStarted(true);
    claim({ id: tokenId });
  };

  // Extract expected claim values first (needed for hasTokensToClaim check)
  // expectedClaim returns [tokens, refundAmount] from contract
  const actualTokens = expectedClaim ? expectedClaim[0] : 0n;
  const refundAmount = expectedClaim ? expectedClaim[1] : 0n;
  const hasRefund = refundAmount > 0n;

  // Check if user has tokens to claim
  // Use expectedClaim instead of userCommitment.tokenAmount because tokenAmount is not stored in the commitment struct
  const hasTokensToClaim =
    userCommitment &&
    actualTokens > 0n && // Use calculated tokens from expectedClaim
    !userCommitment.claimed;

  // Check if user already claimed (or claim is confirmed)
  const alreadyClaimed =
    (userCommitment && userCommitment.claimed) || isClaimConfirmed;

  // Check if user has no commitment
  const noCommitment = !userCommitment || userCommitment.amount === 0n;

  const isTransacting = isClaiming || isConfirmingClaim;

  // Show claim section only if has tokens and hasn't started claiming yet
  // Also hide immediately when claim is confirmed, even before contract data refreshes
  const showClaimSection =
    hasTokensToClaim && !claimStarted && !isClaimConfirmed;

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        <Gift className="text-green-500" /> Claim {tokenName} Tokens
      </h2>

      {/* Transaction Processing State */}
      {claimStarted && isTransacting && (
        <div className="bg-neutral-500/20 border border-neutral-600 text-neutral-300 p-4 rounded-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-400"></div>
            <div>
              <div className="text-sm font-medium mb-1">
                {isClaiming ? "Confirm Transaction..." : "Processing Claim..."}
              </div>
              <div className="text-xs text-neutral-300">
                {isClaiming
                  ? "Please confirm the transaction in your wallet"
                  : "Your claim is being processed on the blockchain"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {claimError && (
        <div className="bg-red-500/20 border border-red-600 text-red-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1 break-words">
            ❌{" "}
            {claimError.message?.includes("rejected") ||
            claimError.message?.includes("denied") ||
            claimError.message?.includes("cancel")
              ? "Transaction Cancelled"
              : "Claim Failed"}
          </div>
          <div className="text-xs text-red-300 break-words">
            {claimError.message?.includes("rejected") ||
            claimError.message?.includes("denied") ||
            claimError.message?.includes("cancel")
              ? "You cancelled the transaction. Click the claim button to try again."
              : claimError.message ||
                "There was an error claiming your tokens. Please try again."}
          </div>
        </div>
      )}

      {/* Already Claimed Message */}
      {alreadyClaimed && !isTransacting && (
        <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-md">
          <div className="text-sm font-medium mb-2 text-green-400 flex items-center gap-2">
            <CheckCircle size={16} />
            Tokens Claimed Successfully!
          </div>
          <div className="text-xs text-neutral-300">
            {userCommitment && (
              <>
                You successfully claimed{" "}
                <span className="text-white font-medium">
                  {formatTokenAmount(formatEther(userCommitment.tokenAmount))}{" "}
                  {tokenName}
                </span>{" "}
                tokens. Check your wallet!
              </>
            )}
            {!userCommitment && (
              <>Your {tokenName} tokens have been transferred to your wallet!</>
            )}
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

      {/* Claim Section - Only show if user has tokens to claim and hasn't started claiming */}
      {showClaimSection && (
        <>
          {/* Oversubscription Notice - Shows if user will receive a refund */}
          {hasRefund && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-orange-400 font-semibold text-sm mb-1">
                    Launch Oversubscribed
                  </div>
                  <div className="text-neutral-300 text-xs">
                    This launch exceeded its target. Tokens were allocated
                    proportionally and you'll receive a refund of{" "}
                    <span className="text-white font-medium">
                      {formatTokenAmount(formatEther(refundAmount))} ETH
                    </span>{" "}
                    along with your tokens.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token Allocation Display */}
          <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-md">
            <div className="text-sm font-medium mb-3 text-green-400">
              🎉 Your Claim Details
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">
                  Tokens to Claim:
                </span>
                <span className="text-white font-bold text-lg">
                  {formatTokenAmount(formatEther(actualTokens))} {tokenName}
                </span>
              </div>
              {hasRefund && (
                <div className="flex justify-between items-center pt-2 border-t border-green-500/30">
                  <span className="text-xs text-neutral-400">ETH Refund:</span>
                  <span className="text-white font-bold text-lg">
                    {formatTokenAmount(formatEther(refundAmount))} ETH
                  </span>
                </div>
              )}
              {userCommitment && (
                <div className="flex justify-between items-center text-xs text-neutral-500 pt-1">
                  <span>Your Commitment:</span>
                  <span>
                    {formatTokenAmount(formatEther(userCommitment.amount))} ETH
                  </span>
                </div>
              )}
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
          <div className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm p-3 rounded-md">
            <div className="font-medium mb-1">ℹ️ Claim Info</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>
                • Click the button above to claim your {tokenName} tokens
              </div>
              <div>
                • Tokens{hasRefund ? " and ETH refund" : ""} will be transferred
                to your wallet
              </div>
              <div>• This is a one-time action - you can only claim once</div>
              {hasRefund && (
                <div className="text-orange-300 mt-2">
                  ⚠️ Both tokens and refund will be sent in a single transaction
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClaimTokenPanel;
