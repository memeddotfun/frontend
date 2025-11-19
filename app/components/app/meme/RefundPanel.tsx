import { useState, useEffect } from "react";
import { RefreshCcw, CheckCircle } from "lucide-react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  useRefund,
  useGetUserCommitment,
  useFairLaunchData,
  useRaiseEth,
} from "@/hooks/contracts/useMemedTokenSale";
import { usePaymentTokenInfo } from "@/hooks/contracts/usePaymentToken";

/**
 * Format large numbers for display with proper decimal places and compact notation
 * @param value - The number value as a string (from formatUnits)
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

interface RefundPanelProps {
  tokenId: bigint;
  tokenName?: string; // Token name for display
}

/**
 * RefundPanel Component
 *
 * Displays refund functionality for failed launches (status 4).
 * Shows user's committed amount and allows them to get their refund.
 */
const RefundPanel = ({ tokenId, tokenName = "Token" }: RefundPanelProps) => {
  const { address } = useAccount();

  // Get payment token info
  const { symbol: tokenSymbol, decimals: tokenDecimals } = usePaymentTokenInfo();

  // Get user's commitment data
  const { data: userCommitment, isLoading: isLoadingCommitment } =
    useGetUserCommitment(tokenId, address);

  // Get fair launch data to determine failure reason
  const { data: fairLaunchData } = useFairLaunchData(tokenId);
  const { data: raiseTarget } = useRaiseEth();

  // Calculate failure reason
  // fairLaunchData[2] = totalCommitted (amount raised)
  const totalCommitted = fairLaunchData ? fairLaunchData[2] : 0n;
  const targetNotReached = raiseTarget && totalCommitted < raiseTarget;

  // Refund hook
  const {
    refund,
    isPending: isRefunding,
    isConfirming: isConfirmingRefund,
    isConfirmed: isRefundConfirmed,
  } = useRefund();

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle success message when refund is confirmed
  useEffect(() => {
    if (isRefundConfirmed) {
      // Show success message
      setShowSuccessMessage(true);

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isRefundConfirmed]);

  const handleRefund = () => {
    refund({ id: tokenId });
  };

  // Check if user has refund available
  const hasRefundAvailable =
    userCommitment &&
    userCommitment.amount > 0n &&
    !userCommitment.refunded;

  // Check if user already refunded
  const alreadyRefunded = userCommitment && userCommitment.refunded;

  // Check if user has no commitment
  const noCommitment = !userCommitment || userCommitment.amount === 0n;

  const isTransacting = isRefunding || isConfirmingRefund;

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        {hasRefundAvailable ? (
          <>
            <RefreshCcw className="text-yellow-500" /> Refund Available
          </>
        ) : alreadyRefunded ? (
          <>
            <CheckCircle className="text-green-500" /> Refund Claimed
          </>
        ) : (
          <>
            <RefreshCcw className="text-neutral-500" /> No Refund Available
          </>
        )}
      </h2>

      {/* Launch Failed Notice with Detailed Reason */}
      <div className="bg-red-500/20 border border-red-600 text-red-300 p-3 rounded-md">
        <div className="text-sm font-medium mb-1">❌ Launch Failed</div>
        <div className="text-xs text-red-300 space-y-1">
          <div>The {tokenName} launch did not succeed.</div>

          {/* Show specific failure reason */}
          {targetNotReached && raiseTarget ? (
            <div className="mt-2 bg-red-500/10 p-2 rounded">
              <span className="font-semibold">Reason:</span> Target not reached
              <br />
              <span className="text-xs">
                Raised: {formatTokenAmount(formatUnits(totalCommitted, 18))} ETH
                {" / "}
                Target: {formatTokenAmount(formatUnits(raiseTarget, 18))} ETH
              </span>
            </div>
          ) : (
            <div className="mt-2 bg-red-500/10 p-2 rounded">
              <span className="font-semibold">Reason:</span> Time expired before
              reaching target
            </div>
          )}

          <div className="mt-2">
            You can claim a full refund of your committed funds.
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/20 border border-green-600 text-green-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">
            ✅ Refund Successful!
          </div>
          <div className="text-xs text-green-300">
            Your {tokenSymbol || "tokens"} have been returned to your wallet.
          </div>
        </div>
      )}

      {/* Already Refunded Message */}
      {alreadyRefunded && (
        <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-md">
          <div className="text-sm font-medium mb-2 text-green-400 flex items-center gap-2">
            <CheckCircle size={16} />
            Refund Already Processed
          </div>
          <div className="text-xs text-neutral-300">
            You successfully received a refund of{" "}
            <span className="text-white font-medium">
              {formatTokenAmount(formatUnits(userCommitment.amount, tokenDecimals || 18))} {tokenSymbol || "TOKEN"}
            </span>. Check your wallet!
          </div>
        </div>
      )}

      {/* No Commitment Message */}
      {noCommitment && (
        <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-md">
          <div className="text-sm text-neutral-400 text-center">
            You don't have any commitment to refund for this launch.
          </div>
        </div>
      )}

      {/* Refund Section - Only show if user has refund available */}
      {hasRefundAvailable && (
        <>
          {/* Refund Amount Display */}
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-md">
            <div className="text-sm font-medium mb-3 text-yellow-400">
              💰 Your Refund Amount
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">You will receive:</span>
                <span className="text-white font-bold text-lg">
                  {formatTokenAmount(formatUnits(userCommitment.amount, tokenDecimals || 18))} {tokenSymbol || "TOKEN"}
                </span>
              </div>
            </div>
            <div className="text-xs text-neutral-400 mt-2">
              This is the full amount you committed to the launch.
            </div>
          </div>

          {/* Refund Button */}
          <button
            onClick={handleRefund}
            disabled={isTransacting || !address}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            {isTransacting
              ? "Processing Refund..."
              : !address
              ? "Connect Wallet"
              : `Claim Refund (${formatTokenAmount(formatUnits(userCommitment.amount, tokenDecimals || 18))} ${tokenSymbol || "TOKEN"})`}
          </button>

          {/* Info Box */}
          <div className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm p-3 rounded-md">
            <div className="font-medium mb-1">ℹ️ Refund Info</div>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>• You'll receive 100% of your committed {tokenSymbol || "tokens"}</div>
              <div>• {tokenSymbol || "Tokens"} will be transferred directly to your wallet</div>
              <div>• This is a one-time action - you can only claim refund once</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RefundPanel;
