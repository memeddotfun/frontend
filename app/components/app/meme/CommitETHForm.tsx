import { useState, useEffect, useCallback, useMemo } from "react";
import { CoinsIcon, TrendingDown, CheckCircle, AlertTriangle } from "lucide-react";
import { parseEther, formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { toast } from "sonner";
import {
  usePricePerTokenWei,
  useCommitToFairLaunch,
  useGetUserCommitment,
  useCancelCommit,
  useGetExpectedClaim,
  useFairLaunchData,
  useRaiseEth,
  useCalculateTokensForCommitment,
} from "@/hooks/contracts/useMemedTokenSale";
import { useEthUsdPrice, useWeiToUsd } from "@/hooks/contracts/useChainlinkPriceFeed";

/**
 * Flow states for the unified commit transaction flow
 * Simplified from ERC20 flow - no approval needed for native ETH
 * - idle: Ready to start
 * - committing: Commit transaction in progress
 * - completed: Commit successful
 * - error: Something went wrong
 */
type FlowState = "idle" | "committing" | "completed" | "error";

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

/**
 * Format very small ETH values (like token prices) with appropriate precision
 */
function formatSmallEthPrice(value: string): string {
  const num = parseFloat(value);
  if (num === 0) return "0";
  
  // For very small numbers, show in scientific notation or more decimals
  if (num < 0.0001) {
    return num.toExponential(2); // e.g., "1.00e-5"
  }
  if (num < 0.01) {
    return num.toFixed(6); // e.g., "0.000100"
  }
  return num.toFixed(4);
}

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface CommitETHFormProps {
  tokenId: bigint;
  tokenName?: string; // Token name from API metadata
  tokenSymbol?: string; // Token ticker/symbol from API metadata
  onCommitSuccess?: () => void; // Optional callback when commit is successful
}

const CommitETHForm = ({ tokenId, tokenName, tokenSymbol: memeTokenSymbol, onCommitSuccess }: CommitETHFormProps) => {
  // ETH amount input (user enters ETH, not ERC20 tokens)
  const [ethAmount, setEthAmount] = useState("");

  // State machine to track the unified transaction flow (simplified - no approval needed)
  const [flowState, setFlowState] = useState<FlowState>("idle");

  const { address } = useAccount();

  // ETH Balance (replaces ERC20 token balance)
  const { data: ethBalance } = useBalance({ address });

  // Chainlink price feed for USD display
  const { data: ethUsdPrice } = useEthUsdPrice();

  // Contract hooks
  const { data: pricePerTokenWei, isLoading: isLoadingPrice } =
    usePricePerTokenWei();
  const {
    commitToFairLaunch,
    isPending: isCommitting,
    isConfirming: isConfirmingCommit,
    isConfirmed: isCommitConfirmed,
    error: commitError,
  } = useCommitToFairLaunch();
  const {
    cancelCommit,
    isPending: isCancelling,
    isConfirming: isConfirmingCancel,
  } = useCancelCommit();

  // Get fair launch data to check for oversubscription
  const { data: fairLaunchData } = useFairLaunchData(tokenId);
  const { data: raiseTarget } = useRaiseEth();
  const TARGET_ETH = raiseTarget || 40n * 10n ** 18n;

  // Get expected claim to show what user will actually receive
  const { data: expectedClaim } = useGetExpectedClaim(tokenId, address);

  // Calculate if launch is currently oversubscribed
  const totalCommitted = fairLaunchData ? fairLaunchData[2] : 0n;
  const isOversubscribed = totalCommitted > TARGET_ETH;

  // Debounce the input amount
  const debouncedEthAmount = useDebounce(ethAmount, 500);

  // Convert ETH input to Wei (18 decimals)
  const ethAmountInWei = debouncedEthAmount
    ? parseEther(debouncedEthAmount as `${number}`)
    : 0n;

  // Get user's current commitment
  const { data: userCommitment, isLoading: isLoadingCommitment } =
    useGetUserCommitment(tokenId, address);

  // Use contract function to calculate tokens and refund amount
  // This shows users what they'll receive BEFORE they commit
  // Accounts for oversubscription and refunds automatically
  const { data: calculationResult } = useCalculateTokensForCommitment(
    tokenId,
    ethAmountInWei
  );

  // Extract tokens and refund amount from contract result
  // Only show calculated tokens if user has entered an amount
  // Note: Use !== undefined instead of truthy check because 0n is falsy but valid
  const calculatedTokens = ethAmount && calculationResult?.[0] !== undefined
    ? formatEther(calculationResult[0])
    : "";
  const refundAmount = ethAmount && calculationResult?.[1] !== undefined ? calculationResult[1] : 0n;

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle commit completion - reset form and show success
  useEffect(() => {
    if (isCommitConfirmed && flowState === "committing") {
      setFlowState("completed");

      // Clear form inputs
      setEthAmount("");

      // Show success message
      setShowSuccessMessage(true);

      // Hide success message after 5 second
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      // Notify parent component to refresh
      onCommitSuccess?.();

      // Reset flow state to idle after 2 seconds
      setTimeout(() => {
        setFlowState("idle");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCommitConfirmed, flowState, onCommitSuccess]);

  // Handle commit errors - reset flow state and show error message
  useEffect(() => {
    if (commitError && flowState === "committing") {
      setFlowState("error");
      toast.error("Commit failed. Please try again.");
      console.error("Commit error:", commitError);
    }
  }, [commitError, flowState]);

  /**
   * Simplified commit handler - sends native ETH directly (no approval needed)
   * Single-step process compared to ERC20's two-step approve + commit flow
   */
  const handleCommitClick = () => {
    if (ethAmountInWei === 0n) return;

    setFlowState("committing");

    // Send native ETH directly via value parameter
    commitToFairLaunch({
      launchId: tokenId,
      value: ethAmountInWei, // ETH sent with transaction
    });
  };

  // Reset flow state if user cancelled wallet popup (isPending goes false without confirmation)
  useEffect(() => {
    if (flowState === "committing" && !isCommitting && !isConfirmingCommit && !isCommitConfirmed && !commitError) {
      setFlowState("idle");
    }
  }, [flowState, isCommitting, isConfirmingCommit, isCommitConfirmed, commitError]);

  const handleCancelCommit = () => {
    // Cancel user's commitment if they have an active commitment
    if (userCommitment && userCommitment.amount > 0n) {
      cancelCommit({ id: tokenId });
    }
  };

  // Calculate required amount - memoized to prevent recalculation on every render
  const requiredAmount = useMemo(
    () => ethAmountInWei,
    [ethAmountInWei]
  );

  // Check if user has enough ETH balance - memoized for performance
  // Only returns false when balance is loaded AND insufficient (not during loading)
  const hasEnoughBalance = useMemo(
    () => {
      // If balance is not yet loaded, assume enough (don't show warning)
      if (!ethBalance) return true;
      // If no amount entered, consider it valid
      if (requiredAmount <= 0n) return true;
      // Check actual balance
      return ethBalance.value >= requiredAmount;
    },
    [ethBalance, requiredAmount]
  );

  // Validate commit input - memoized for performance
  const isCommitValid = useMemo(
    () => ethAmount && parseFloat(ethAmount) > 0,
    [ethAmount]
  );

  // Check if any transaction is in progress - memoized for performance
  const isTransacting = useMemo(
    () =>
      isCommitting ||
      isConfirmingCommit ||
      isCancelling ||
      isConfirmingCancel,
    [
      isCommitting,
      isConfirmingCommit,
      isCancelling,
      isConfirmingCancel,
    ]
  );

  /**
   * Get button text based on current flow state (simplified - no approval states)
   */
  const getCommitButtonText = () => {
    switch (flowState) {
      case "committing":
        return "Committing...";
      case "completed":
        return "Committed!";
      case "error":
        return "Try Again";
      default:
        return "Commit";
    }
  };

  // Check if commit button should be disabled
  const isCommitButtonDisabled =
    !isCommitValid ||
    !address ||
    !hasEnoughBalance ||
    flowState === "committing" ||
    flowState === "completed";

  // Convert Wei amounts to USD for display
  // Always call hooks unconditionally (Rules of Hooks) - they handle undefined gracefully
  const inputUsdValue = useWeiToUsd(ethAmountInWei);
  const balanceUsdValue = useWeiToUsd(ethBalance?.value);
  const commitmentUsdValue = useWeiToUsd(userCommitment?.amount);
  const refundUsdValue = useWeiToUsd(refundAmount);
  const pricePerTokenUsd = useWeiToUsd(pricePerTokenWei);
  const expectedRefundUsd = useWeiToUsd(expectedClaim?.[1]);

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        <CoinsIcon className="text-green-500" /> Commit ETH
      </h2>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/20 border border-green-600 text-green-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">
            ✅ Commitment Successful!
          </div>
          <div className="text-xs text-green-300">
            Your ETH commitment has been confirmed. The launch progress will update shortly.
          </div>
        </div>
      )}

      {/* Chainlink Price Staleness Warning */}
      {ethUsdPrice?.isStale && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-2 rounded-md text-xs">
          ⚠️ Price data may be outdated
        </div>
      )}

      {/* User's Current Commitment Display - Green theme for active/positive state */}
      {userCommitment &&
        userCommitment.amount > 0n &&
        !userCommitment.refunded && ( // amount > 0 and not refunded
          <div className="bg-green-500/10 border border-green-500/50 p-3 rounded-md">
            <div className="text-sm font-medium mb-2 text-green-400">
              💰 Your Active Commitment
            </div>
            <div className="space-y-1 text-xs text-neutral-300">
              <div className="font-medium">
                ETH Committed:{" "}
                <span className="text-white">
                  {formatTokenAmount(formatEther(userCommitment.amount))} ETH
                </span>
                {commitmentUsdValue && (
                  <span className="text-neutral-400 ml-2">
                    ({commitmentUsdValue})
                  </span>
                )}
              </div>
              <div className="font-medium">
                Expected Tokens:{" "}
                <span className="text-white">
                  {/* Use expectedClaim[0] when available (accurate for oversubscribed), else fall back to tokenAmount */}
                  {formatTokenAmount(formatEther(expectedClaim?.[0] ?? userCommitment.tokenAmount))}{" "}
                  {memeTokenSymbol || "MEME"}
                </span>
              </div>
              {expectedClaim && expectedClaim[1] > 0n && (
                <div className="font-medium">
                  Expected Refund:{" "}
                  <span className="text-white">
                    {formatTokenAmount(formatEther(expectedClaim[1]))} ETH
                  </span>
                  {expectedRefundUsd && (
                    <span className="text-neutral-400 ml-2">
                      ({expectedRefundUsd})
                    </span>
                  )}
                </div>
              )}
              {userCommitment.claimed && (
                <div className="text-green-400 font-medium">
                  ✅ Tokens Claimed
                </div>
              )}
              {!userCommitment.claimed && (
                <div className="text-green-300/80 text-xs mt-1">
                  💡 You can claim tokens after fair launch completion
                </div>
              )}
            </div>
            <button
              onClick={handleCancelCommit}
              disabled={isTransacting || userCommitment.claimed} // Can't cancel if already claimed
              className="mt-3 w-full bg-red-800 hover:bg-red-900 text-white font-medium py-2 px-2 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
            >
              <TrendingDown size={14} />
              {isCancelling || isConfirmingCancel
                ? "Cancelling..."
                : "Cancel Commitment"}
            </button>
          </div>
        )}

      {/* Input Section */}
      <div>
        <label className="block text-sm text-neutral-400 mb-1">
          ETH Amount to Commit
        </label>
        <input
          type="number"
          placeholder="0.00 ETH"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          className="w-full p-2 rounded-md bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        {/* Real-time USD conversion below input */}
        {ethAmount && inputUsdValue && (
          <div className="text-xs text-neutral-400 mt-1">
            ≈ {inputUsdValue}
          </div>
        )}
      </div>

      <div className="text-center text-2xl text-neutral-400">→</div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1">
          Expected {memeTokenSymbol || "MEME"} Tokens
        </label>
        <input
          type="number"
          placeholder={isLoadingPrice ? "Calculating..." : "0.00"}
          value={calculatedTokens}
          disabled
          className="w-full p-2 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700"
        />
      </div>

      {/* Refund Warning - Shows if user will receive refund BEFORE they commit */}
      {refundAmount > 0n && calculatedTokens && parseFloat(calculatedTokens) > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 -mt-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-yellow-400 font-semibold text-xs mb-1">
                Amount Exceeds Target (40 ETH)
              </div>
              <div className="text-neutral-300 text-xs space-y-1">
                <div>
                  You'll receive: <span className="text-white font-medium">
                    {formatTokenAmount(calculatedTokens)} {memeTokenSymbol || "MEME"} tokens
                  </span>
                </div>
                <div>
                  Refund amount: <span className="text-white font-medium">
                    {formatTokenAmount(formatEther(refundAmount))} ETH
                  </span>
                  {refundUsdValue && (
                    <span className="text-neutral-400 ml-2">
                      ({refundUsdValue})
                    </span>
                  )}
                </div>
                <div className="text-xs text-yellow-300/80 mt-1">
                  The target is 40 ETH. Your excess contribution will be refunded.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expected Claim Preview - Shows actual tokens user will receive if oversubscribed */}
      {expectedClaim && isOversubscribed && calculatedTokens && parseFloat(calculatedTokens) > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 -mt-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-orange-400 font-semibold text-xs mb-1">
                Launch Currently Oversubscribed
              </div>
              <div className="text-neutral-300 text-xs space-y-1">
                <div>
                  Expected to receive: <span className="text-white font-medium">
                    {formatTokenAmount(formatEther(expectedClaim[0]))} {memeTokenSymbol || "MEME"}
                  </span>
                </div>
                {expectedClaim[1] > 0n && (
                  <div>
                    Potential refund: <span className="text-white font-medium">
                      {formatTokenAmount(formatEther(expectedClaim[1]))} ETH
                    </span>
                    {expectedRefundUsd && (
                      <span className="text-neutral-400 ml-2">
                        ({expectedRefundUsd})
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-orange-300/80 mt-1">
                  Final allocation may vary as more users commit
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Display with USD value */}
      {ethBalance !== undefined && (
        <div className="text-xs text-neutral-400 text-center">
          Balance: {formatTokenAmount(formatEther(ethBalance.value))} ETH
          {balanceUsdValue && (
            <span className="ml-2">
              ({balanceUsdValue})
            </span>
          )}
        </div>
      )}

      {/* Price Display - USD prominently, ETH with proper precision */}
      {pricePerTokenWei && (
        <div className="text-xs text-neutral-400 text-center">
          Price per {memeTokenSymbol || "MEME"} token:{" "}
          {pricePerTokenUsd ? (
            <span className="text-green-400 font-semibold">{pricePerTokenUsd} USD</span>
          ) : (
            <span className="text-white">{formatSmallEthPrice(formatEther(pricePerTokenWei))} ETH</span>
          )}
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {isCommitValid && !hasEnoughBalance && (
        <div className="bg-red-500/20 border border-red-600 text-red-300 text-sm p-2 rounded-md text-center">
          Insufficient ETH balance
        </div>
      )}

      {/* Single Unified Commit Button (simplified - no approval step) */}
      <button
        onClick={() => {
          // Reset error state on retry
          if (flowState === "error") {
            setFlowState("idle");
          }
          handleCommitClick();
        }}
        disabled={isCommitButtonDisabled}
        className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-2 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer"
      >
        {!address ? "Connect Wallet" : getCommitButtonText()}
      </button>

      {/* Warning Box - Updated for ETH and simplified flow */}
      <div className="bg-yellow-500/20 border border-yellow-600 text-yellow-300 text-sm p-3 rounded-md">
        <div className="font-medium mb-1">⚠️ Fair Launch Commitment Info</div>
        <div className="text-xs text-yellow-300 space-y-1">
          <div>
            • Commit ETH to get expected {memeTokenSymbol || "MEME"} tokens at fixed price
          </div>
          <div>
            • Your commitment is{" "}
            <span className="font-medium">refundable anytime</span> before
            launch completion
          </div>
          <div>• Tokens can be claimed once the fair launch reaches target</div>
          <div>
            • Native ETH is used - no token approval needed
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitETHForm;
