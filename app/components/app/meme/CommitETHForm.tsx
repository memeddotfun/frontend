import { useState, useEffect, useCallback, useMemo } from "react";
import { CoinsIcon, TrendingDown, CheckCircle } from "lucide-react";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import {
  usePricePerTokenWei,
  useCommitToFairLaunch,
  useGetUserCommitment,
  useCancelCommit,
} from "@/hooks/contracts/useMemedTokenSale";
import {
  usePaymentTokenBalance,
  usePaymentTokenAllowance,
  usePaymentTokenInfo,
  useApprovePaymentToken,
} from "@/hooks/contracts/usePaymentToken";

/**
 * Flow states for the unified commit transaction flow
 * - idle: Ready to start
 * - checking-allowance: Checking if approval is needed
 * - approving: Approval transaction in progress
 * - approved: Approval confirmed, about to commit
 * - committing: Commit transaction in progress
 * - completed: Commit successful
 * - error: Something went wrong
 */
type FlowState =
  | "idle"
  | "checking-allowance"
  | "approving"
  | "approved"
  | "committing"
  | "completed"
  | "error";

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
  onCommitSuccess?: () => void; // Optional callback when commit is successful
}

const CommitETHForm = ({ tokenId, onCommitSuccess }: CommitETHFormProps) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [calculatedTokens, setCalculatedTokens] = useState("");

  // State machine to track the unified transaction flow
  const [flowState, setFlowState] = useState<FlowState>("idle");

  const { address } = useAccount();

  // Contract hooks
  const { data: pricePerTokenWei, isLoading: isLoadingPrice } =
    usePricePerTokenWei();
  const {
    commitToFairLaunch,
    isPending: isCommitting,
    isConfirming: isConfirmingCommit,
    isConfirmed: isCommitConfirmed,
  } = useCommitToFairLaunch();
  const {
    cancelCommit,
    isPending: isCancelling,
    isConfirming: isConfirmingCancel,
  } = useCancelCommit();

  // Payment token hooks
  const { data: tokenBalance } = usePaymentTokenBalance();
  const { data: tokenAllowance, refetch: refetchAllowance } =
    usePaymentTokenAllowance();
  const { symbol: tokenSymbol, decimals: tokenDecimals } =
    usePaymentTokenInfo();
  const {
    approveToken,
    isPending: isApproving,
    isConfirming: isConfirmingApproval,
    isConfirmed: isApprovalConfirmed,
  } = useApprovePaymentToken();

  // Debounce the input amount
  const debouncedPaymentAmount = useDebounce(paymentAmount, 500);

  // Convert to bigint - using payment token decimals
  const paymentTokenAmountAsBigInt = debouncedPaymentAmount
    ? parseUnits(debouncedPaymentAmount as `${number}`, tokenDecimals || 18)
    : 0n;

  // Get user's current commitment
  const { data: userCommitment, isLoading: isLoadingCommitment } =
    useGetUserCommitment(tokenId, address);

  // Calculate MEME tokens from payment token amount
  // Memoized with useCallback to prevent unnecessary re-creation on every render
  const calculateMemeTokensFromPaymentToken = useCallback(
    (paymentAmount: bigint) => {
      if (!pricePerTokenWei || paymentAmount === 0n || !tokenDecimals)
        return 0n;
      // Convert payment token amount to 18 decimals for calculation
      const paymentAmountIn18Decimals =
        paymentAmount * 10n ** (18n - BigInt(tokenDecimals));
      return (paymentAmountIn18Decimals * parseEther("1")) / pricePerTokenWei;
    },
    [pricePerTokenWei, tokenDecimals]
  );

  // Update calculated MEME tokens when payment amount changes
  useEffect(() => {
    if (paymentTokenAmountAsBigInt > 0n) {
      const tokens = calculateMemeTokensFromPaymentToken(
        paymentTokenAmountAsBigInt
      );
      setCalculatedTokens(formatEther(tokens));
    } else {
      setCalculatedTokens("");
    }
  }, [paymentTokenAmountAsBigInt, calculateMemeTokensFromPaymentToken]);

  // Auto-progress: After approval confirms, wait for allowance update then auto-commit
  useEffect(() => {
    if (isApprovalConfirmed && flowState === "approving") {
      setFlowState("approved");

      // Wait for allowance to update on blockchain
      setTimeout(() => {
        refetchAllowance().then(() => {
          // Automatically trigger commit after approval
          if (paymentTokenAmountAsBigInt > 0n) {
            commitToFairLaunch({
              launchId: tokenId,
              amount: paymentTokenAmountAsBigInt,
            });
            setFlowState("committing");
          }
        });
      }, 1000); // 1 second delay to ensure blockchain state is updated
    }
  }, [
    isApprovalConfirmed,
    flowState,
    refetchAllowance,
    commitToFairLaunch,
    tokenId,
    paymentTokenAmountAsBigInt,
  ]);

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle commit completion - reset form and show success
  useEffect(() => {
    if (isCommitConfirmed && flowState === "committing") {
      setFlowState("completed");

      // Clear form inputs
      setPaymentAmount("");
      setCalculatedTokens("");

      // Show success message
      setShowSuccessMessage(true);

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      // Refresh data to show updated progress
      refetchAllowance();

      // Notify parent component to refresh
      onCommitSuccess?.();

      // Reset flow state to idle after 2 seconds
      setTimeout(() => {
        setFlowState("idle");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCommitConfirmed, flowState, refetchAllowance, onCommitSuccess]);

  /**
   * Unified commit handler - single click orchestrates entire flow
   * 1. Checks allowance
   * 2. If insufficient, triggers approve first
   * 3. Auto-progresses to commit after approval (via useEffect)
   * 4. If sufficient, commits directly
   */
  const handleCommitClick = () => {
    if (paymentTokenAmountAsBigInt === 0n) return;

    setFlowState("checking-allowance");

    // Check if we have enough allowance
    if (
      tokenAllowance !== undefined &&
      tokenAllowance >= paymentTokenAmountAsBigInt
    ) {
      // Sufficient allowance - commit directly
      commitToFairLaunch({
        launchId: tokenId,
        amount: paymentTokenAmountAsBigInt,
      });
      setFlowState("committing");
    } else {
      // Insufficient allowance - trigger approve first
      approveToken(paymentTokenAmountAsBigInt);
      setFlowState("approving");
    }
  };

  const handleCancelCommit = () => {
    // Cancel user's commitment if they have an active commitment
    if (userCommitment && userCommitment.amount > 0n) {
      cancelCommit({ id: tokenId });
    }
  };

  // Calculate required amount - memoized to prevent recalculation on every render
  const requiredAmount = useMemo(
    () => paymentTokenAmountAsBigInt,
    [paymentTokenAmountAsBigInt]
  );

  // Check if user has enough balance - memoized for performance
  const hasEnoughBalance = useMemo(
    () =>
      tokenBalance && requiredAmount > 0n
        ? tokenBalance >= requiredAmount
        : false,
    [tokenBalance, requiredAmount]
  );

  // Validate commit input - memoized for performance
  const isCommitValid = useMemo(
    () => paymentAmount && parseFloat(paymentAmount) > 0,
    [paymentAmount]
  );

  // Check if any transaction is in progress - memoized for performance
  const isTransacting = useMemo(
    () =>
      isCommitting ||
      isConfirmingCommit ||
      isCancelling ||
      isConfirmingCancel ||
      isApproving ||
      isConfirmingApproval,
    [
      isCommitting,
      isConfirmingCommit,
      isCancelling,
      isConfirmingCancel,
      isApproving,
      isConfirmingApproval,
    ]
  );

  /**
   * Get button text based on current flow state
   */
  const getCommitButtonText = () => {
    switch (flowState) {
      case "checking-allowance":
        return "Checking allowance...";
      case "approving":
        return "Approving...";
      case "approved":
        return "Approved! Committing...";
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
    flowState === "checking-allowance" ||
    flowState === "approving" ||
    flowState === "approved" ||
    flowState === "committing" ||
    flowState === "completed";

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        <CoinsIcon className="text-green-500" /> Commit{" "}
        {tokenSymbol || "Tokens"}
      </h2>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/20 border border-green-600 text-green-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">
            ✅ Commitment Successful!
          </div>
          <div className="text-xs text-green-300">
            Your {tokenSymbol || "TOKEN"} commitment has been confirmed. The
            launch progress will update shortly.
          </div>
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
                {tokenSymbol || "Tokens"} Committed:{" "}
                <span className="text-white">
                  {formatTokenAmount(
                    formatUnits(userCommitment.amount, tokenDecimals || 18)
                  )}{" "}
                  {tokenSymbol || "TOKEN"}
                </span>
              </div>
              <div className="font-medium">
                Tokens Reserved:{" "}
                <span className="text-white">
                  {formatTokenAmount(formatEther(userCommitment.tokenAmount))}{" "}
                  MEME
                </span>
              </div>
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
          {tokenSymbol || "TOKEN"} Amount to Commit
        </label>
        <input
          type="number"
          placeholder={`0.00 ${tokenSymbol || "TOKEN"}`}
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="w-full p-2 rounded-md bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="text-center text-2xl text-neutral-400">→</div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1">
          You'll Reserve MEME Tokens
        </label>
        <input
          type="number"
          placeholder={isLoadingPrice ? "Calculating..." : "0.00"}
          value={calculatedTokens}
          disabled
          className="w-full p-2 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700"
        />
      </div>

      {/* Balance Display - Formatted for better readability */}
      {tokenBalance !== undefined && (
        <div className="text-xs text-neutral-400 text-center">
          Your Balance:{" "}
          {formatTokenAmount(formatUnits(tokenBalance, tokenDecimals || 18))}{" "}
          {tokenSymbol || "TOKEN"}
        </div>
      )}

      {/* Price Display - Formatted for better readability */}
      {pricePerTokenWei && tokenSymbol && (
        <div className="text-xs text-neutral-400 text-center">
          Price: {formatTokenAmount(formatEther(pricePerTokenWei))}{" "}
          {tokenSymbol} per MEME token
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {isCommitValid && !hasEnoughBalance && (
        <div className="bg-red-500/20 border border-red-600 text-red-300 text-sm p-2 rounded-md text-center">
          Insufficient {tokenSymbol || "TOKEN"} balance
        </div>
      )}

      {/* Single Unified Commit Button */}
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

      {/* Warning Box */}
      <div className="bg-yellow-500/20 border border-yellow-600 text-yellow-300 text-sm p-3 rounded-md">
        <div className="font-medium mb-1">⚠️ Fair Launch Commitment Info</div>
        <div className="text-xs text-yellow-300 space-y-1">
          <div>
            • Commit {tokenSymbol || "TOKEN"} to reserve MEME tokens at fixed
            price
          </div>
          <div>
            • Your commitment is{" "}
            <span className="font-medium">refundable anytime</span> before
            launch completion
          </div>
          <div>• Tokens can be claimed once the fair launch reaches target</div>
          <div>
            • Click once to commit - if needed, you'll be prompted to approve
            first, then commitment happens automatically
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitETHForm;
