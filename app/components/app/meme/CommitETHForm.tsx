import { useState, useEffect } from "react";
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

  const { address } = useAccount();
  
  // Contract hooks
  const { data: pricePerTokenWei, isLoading: isLoadingPrice } = usePricePerTokenWei();
  const { commitToFairLaunch, isPending: isCommitting, isConfirming: isConfirmingCommit } = useCommitToFairLaunch();
  const { cancelCommit, isPending: isCancelling, isConfirming: isConfirmingCancel } = useCancelCommit();
  
  // Payment token hooks
  const { data: tokenBalance } = usePaymentTokenBalance();
  const { data: tokenAllowance, refetch: refetchAllowance } = usePaymentTokenAllowance();
  const { symbol: tokenSymbol, decimals: tokenDecimals } = usePaymentTokenInfo();
  const { approveToken, isPending: isApproving, isConfirming: isConfirmingApproval, isConfirmed: isApprovalConfirmed } = useApprovePaymentToken();
  
  // Debounce the input amount
  const debouncedPaymentAmount = useDebounce(paymentAmount, 500);

  // Convert to bigint - using payment token decimals
  const paymentTokenAmountAsBigInt = debouncedPaymentAmount
    ? parseUnits(debouncedPaymentAmount as `${number}`, tokenDecimals || 18)
    : 0n;
  
  // Get user's current commitment
  const { data: userCommitment, isLoading: isLoadingCommitment } = useGetUserCommitment(
    tokenId,
    address
  );

  // Calculate MEME tokens from payment token amount
  const calculateMemeTokensFromPaymentToken = (paymentAmount: bigint) => {
    if (!pricePerTokenWei || paymentAmount === 0n || !tokenDecimals) return 0n;
    // Convert payment token amount to 18 decimals for calculation
    const paymentAmountIn18Decimals = paymentAmount * (10n ** (18n - BigInt(tokenDecimals)));
    return (paymentAmountIn18Decimals * parseEther("1")) / pricePerTokenWei;
  };

  // Update calculated MEME tokens when payment amount changes
  useEffect(() => {
    if (paymentTokenAmountAsBigInt > 0n) {
      const tokens = calculateMemeTokensFromPaymentToken(paymentTokenAmountAsBigInt);
      setCalculatedTokens(formatEther(tokens));
    } else {
      setCalculatedTokens("");
    }
  }, [paymentTokenAmountAsBigInt, pricePerTokenWei, tokenDecimals]);

  // Refetch allowance after approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Get commit transaction hash and success state
  const { hash: commitHash, isConfirmed: isCommitConfirmed } = useCommitToFairLaunch();
  
  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (isCommitConfirmed) {
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
      // Note: userCommitment will automatically refresh due to the hook dependency
      
      // Notify parent component to refresh
      onCommitSuccess?.();
      
      return () => clearTimeout(timer);
    }
  }, [isCommitConfirmed, refetchAllowance]);

  const handleApprove = () => {
    if (paymentTokenAmountAsBigInt > 0n) {
      approveToken(paymentTokenAmountAsBigInt);
    }
  };

  const handleCommit = () => {
    if (paymentTokenAmountAsBigInt > 0n) {
      commitToFairLaunch({ launchId: tokenId, amount: paymentTokenAmountAsBigInt });
    }
  };

  const handleCancelCommit = () => {
    console.log("=== CANCEL COMMIT DEBUG ===");
    console.log("User Commitment:", userCommitment);
    console.log("Token ID being used:", tokenId);
    console.log("Amount > 0n?", userCommitment && userCommitment.amount > 0n);
    console.log("Is already refunded?", userCommitment?.refunded);
    console.log("=== END CANCEL DEBUG ===");
    
    if (userCommitment && userCommitment.amount > 0n) {
      cancelCommit({ id: tokenId });
    }
  };

  // Calculate required amount and check approval
  const requiredAmount = paymentTokenAmountAsBigInt;
  const hasEnoughAllowance = tokenAllowance && requiredAmount > 0n ? tokenAllowance >= requiredAmount : false;
  const hasEnoughBalance = tokenBalance && requiredAmount > 0n ? tokenBalance >= requiredAmount : false;

  const isCommitValid = paymentAmount && parseFloat(paymentAmount) > 0;

  const isTransacting = isCommitting || isConfirmingCommit || isCancelling || isConfirmingCancel || isApproving || isConfirmingApproval;

  return (
    <div className="bg-neutral-900 p-6 rounded-xl w-full space-y-4">
      <h2 className="text-white text-lg font-semibold flex gap-2 items-center">
        <CoinsIcon className="text-green-500" /> Commit {tokenSymbol || "Tokens"}
      </h2>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/20 border border-green-600 text-green-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">✅ Commitment Successful!</div>
          <div className="text-xs text-green-300">
            Your {tokenSymbol || "TOKEN"} commitment has been confirmed. The launch progress will update shortly.
          </div>
        </div>
      )}

      {/* User's Current Commitment Display */}
      {userCommitment && userCommitment.amount > 0n && !userCommitment.refunded && ( // amount > 0 and not refunded
        <div className="bg-blue-500/20 border border-blue-600 text-blue-300 p-3 rounded-md">
          <div className="text-sm font-medium mb-2">💰 Your Active Commitment</div>
          <div className="space-y-1 text-xs">
            <div className="font-medium">{tokenSymbol || "Tokens"} Committed: <span className="text-white">{formatUnits(userCommitment.amount, tokenDecimals || 18)} {tokenSymbol || "TOKEN"}</span></div>
            <div className="font-medium">Tokens Reserved: <span className="text-white">{formatEther(userCommitment.tokenAmount)} MEME</span></div>
            {userCommitment.claimed && <div className="text-green-400 font-medium">✅ Tokens Claimed</div>}
            {!userCommitment.claimed && (
              <div className="text-orange-300 text-xs mt-1">
                💡 You can claim tokens after fair launch completion
              </div>
            )}
          </div>
          <button
            onClick={handleCancelCommit}
            disabled={isTransacting || userCommitment.claimed} // Can't cancel if already claimed
            className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-2 rounded transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
          >
            <TrendingDown size={14} />
            {isCancelling || isConfirmingCancel ? "Cancelling..." : "Cancel Commitment"}
          </button>
        </div>
      )}

      {/* Input Section */}
      <div>
        <label className="block text-sm text-neutral-400 mb-1">{tokenSymbol || "TOKEN"} Amount to Commit</label>
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
        <label className="block text-sm text-neutral-400 mb-1">You'll Reserve MEME Tokens</label>
        <input
          type="number"
          placeholder={isLoadingPrice ? "Calculating..." : "0.00"}
          value={calculatedTokens}
          disabled
          className="w-full p-2 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700"
        />
      </div>

      {/* Balance Display */}
      {tokenBalance !== undefined && (
        <div className="text-xs text-neutral-400 text-center">
          Your Balance: {formatUnits(tokenBalance, tokenDecimals || 18)} {tokenSymbol || "TOKEN"}
        </div>
      )}

      {/* Price Display */}
      {pricePerTokenWei && tokenSymbol && (
        <div className="text-xs text-neutral-400 text-center">
          Price: {formatEther(pricePerTokenWei)} {tokenSymbol} per MEME token
        </div>
      )}

      {/* Insufficient Balance Warning */}
      {isCommitValid && !hasEnoughBalance && (
        <div className="bg-red-500/20 border border-red-600 text-red-300 text-sm p-2 rounded-md text-center">
          Insufficient {tokenSymbol || "TOKEN"} balance
        </div>
      )}

      {/* Approval/Commit Buttons */}
      {!hasEnoughAllowance && isCommitValid ? (
        <button
          onClick={handleApprove}
          disabled={!isCommitValid || isTransacting || !address || !hasEnoughBalance}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          {isApproving || isConfirmingApproval
            ? "Approving..."
            : !address
            ? "Connect Wallet"
            : `Approve ${tokenSymbol || "TOKEN"}`}
        </button>
      ) : (
        <button
          onClick={handleCommit}
          disabled={!isCommitValid || isTransacting || !address || !hasEnoughBalance || !hasEnoughAllowance}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-2 rounded-md transition disabled:bg-neutral-600 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCommitting || isConfirmingCommit
            ? "Committing..."
            : !address
            ? "Connect Wallet"
            : "Commit"}
        </button>
      )}

      {/* Warning Box */}
      <div className="bg-yellow-500/20 border border-yellow-600 text-yellow-300 text-sm p-3 rounded-md">
        <div className="font-medium mb-1">⚠️ Fair Launch Commitment Info</div>
        <div className="text-xs text-yellow-300 space-y-1">
          <div>• Commit {tokenSymbol || "TOKEN"} to reserve MEME tokens at fixed price</div>
          <div>• Your commitment is <span className="font-medium">refundable anytime</span> before launch completion</div>
          <div>• Tokens can be claimed once the fair launch reaches target</div>
          <div>• You must first approve the contract to spend your {tokenSymbol || "TOKEN"}</div>
        </div>
      </div>
    </div>
  );
};

export default CommitETHForm;