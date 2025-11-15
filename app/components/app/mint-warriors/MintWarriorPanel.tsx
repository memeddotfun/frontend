import { useEffect, useState } from "react";
import { Sword, CheckCircle, Loader2 } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useGetCurrentPrice,
  useGetMemedToken,
  useWarriorBalance,
  useMintWarrior,
} from "@/hooks/contracts/useWarriorNFT";
import {
  useMemedTokenBalance,
  useMemedTokenAllowance,
  useMemedTokenApprove,
} from "@/hooks/contracts/useMemedToken";

/**
 * Flow states for the unified mint transaction flow
 * - idle: Ready to start
 * - checking-allowance: Checking if approval is needed
 * - approving: Approval transaction in progress
 * - approved: Approval confirmed, about to mint
 * - minting: Mint transaction in progress
 * - completed: Mint successful
 * - error: Something went wrong
 */
type FlowState =
  | "idle"
  | "checking-allowance"
  | "approving"
  | "approved"
  | "minting"
  | "completed"
  | "error";

interface MintWarriorPanelProps {
  warriorNFTAddress: `0x${string}` | undefined;
  tokenName?: string;
}

/**
 * MintWarriorPanel Component
 *
 * Implements two-step minting flow:
 * 1. Approve: User approves warrior NFT contract to spend their claimed tokens
 * 2. Mint: User mints a warrior NFT (mintWarrior takes NO parameters!)
 *
 * Payment is in claimed tokens (MEME from fair launch), NOT payment token.
 * Price is dynamic and increases with each mint.
 */
export default function MintWarriorPanel({
  warriorNFTAddress,
  tokenName = "Warriors",
}: MintWarriorPanelProps) {
  const { address: userAddress } = useAccount();

  // State machine to track the unified transaction flow
  const [flowState, setFlowState] = useState<FlowState>("idle");

  // Get current mint price from warrior NFT contract
  const {
    data: currentPrice,
    refetch: refetchPrice,
    error: priceError,
    isLoading: isPriceLoading,
  } = useGetCurrentPrice(warriorNFTAddress);

  // Get payment token address (claimed MEME tokens)
  const { data: paymentTokenAddress, error: tokenAddressError } =
    useGetMemedToken(warriorNFTAddress);

  // Get user's claimed token balance
  const {
    data: userBalance,
    refetch: refetchBalance,
    error: balanceError,
  } = useMemedTokenBalance(paymentTokenAddress);

  // Get user's warrior NFT balance
  const {
    data: nftBalance,
    refetch: refetchNftBalance,
    error: nftBalanceError,
  } = useWarriorBalance(warriorNFTAddress, userAddress);

  // Check current allowance for warrior NFT contract
  const {
    data: allowance,
    refetch: refetchAllowance,
    error: allowanceError,
  } = useMemedTokenAllowance(paymentTokenAddress, warriorNFTAddress);

  // Approve hook
  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    error: approveError,
  } = useMemedTokenApprove(paymentTokenAddress);

  // Mint hook
  const {
    mintWarrior,
    isPending: isMintPending,
    isConfirming: isMintConfirming,
    isConfirmed: isMintConfirmed,
    error: mintError,
  } = useMintWarrior(warriorNFTAddress);

  // Auto-progress: After approval confirms, wait for allowance update then auto-mint
  useEffect(() => {
    if (isApproveConfirmed && flowState === "approving") {
      setFlowState("approved");

      // Wait for allowance to update on blockchain
      setTimeout(() => {
        refetchAllowance().then(() => {
          // Automatically trigger mint after approval
          if (currentPrice) {
            mintWarrior();
            setFlowState("minting");
          }
        });
      }, 1000); // 1 second delay to ensure blockchain state is updated
    }
  }, [
    isApproveConfirmed,
    flowState,
    refetchAllowance,
    mintWarrior,
    currentPrice,
  ]);

  // Handle mint completion - refetch data and show success
  useEffect(() => {
    if (isMintConfirmed && flowState === "minting") {
      setFlowState("completed");

      // Refetch all data to show updated balances
      refetchPrice();
      refetchBalance();
      refetchNftBalance();
      refetchAllowance();

      // Reset to idle after showing success for 2 seconds
      setTimeout(() => {
        setFlowState("idle");
      }, 2000);
    }
  }, [
    isMintConfirmed,
    flowState,
    refetchPrice,
    refetchBalance,
    refetchNftBalance,
    refetchAllowance,
  ]);

  /**
   * Unified mint handler - single click orchestrates entire flow
   * 1. Checks allowance
   * 2. If insufficient, triggers approve first
   * 3. Auto-progresses to mint after approval (via useEffect)
   * 4. If sufficient, mints directly
   */
  const handleMintClick = () => {
    if (!warriorNFTAddress || !currentPrice) return;

    setFlowState("checking-allowance");

    // Check if we have enough allowance
    if (allowance !== undefined && allowance >= currentPrice) {
      // Sufficient allowance - mint directly
      mintWarrior();
      setFlowState("minting");
    } else {
      // Insufficient allowance - trigger approve first
      approve(warriorNFTAddress, currentPrice);
      setFlowState("approving");
    }
  };

  // Check if user has enough balance
  const hasEnoughBalance =
    userBalance !== undefined &&
    currentPrice !== undefined &&
    userBalance >= currentPrice;

  // Handle errors - reset to error state
  useEffect(() => {
    if ((approveError || mintError) && flowState !== "idle") {
      setFlowState("error");
    }
  }, [approveError, mintError, flowState]);

  /**
   * Get button text based on current flow state
   */
  const getButtonText = () => {
    switch (flowState) {
      case "checking-allowance":
        return "Checking allowance...";
      case "approving":
        return "Approving...";
      case "approved":
        return "Approved! Minting...";
      case "minting":
        return "Minting...";
      case "completed":
        return "Minted!";
      case "error":
        return "Try Again";
      default:
        return `Mint ${tokenName} Warrior`;
    }
  };

  // Check if button should be disabled
  const isButtonDisabled =
    !hasEnoughBalance ||
    !currentPrice ||
    flowState === "checking-allowance" ||
    flowState === "approving" ||
    flowState === "approved" ||
    flowState === "minting" ||
    flowState === "completed";

  // Helper function to format token amounts nicely
  const formatTokenAmount = (value: string): string => {
    const num = parseFloat(value);

    // Handle zero and very small numbers
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";

    // For large numbers, use compact notation
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }

    // For smaller numbers, limit to 4 decimal places and add commas
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(num);
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800 sticky top-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white">
          Mint {tokenName} Warriors
        </h2>
      </div>

      {/* User's NFT Balance */}
      {nftBalance !== undefined && (
        <div className="bg-neutral-800 rounded-lg p-3 mb-4">
          <div className="text-sm text-neutral-400">Your Warriors</div>
          <div className="text-2xl font-bold text-white">
            {nftBalance.toString()}
          </div>
        </div>
      )}

      {/* Price Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-400 text-sm">Current Price:</span>
          <span className="text-white font-semibold text-lg">
            {currentPrice ? (
              `${formatTokenAmount(formatEther(currentPrice))} ${tokenName}`
            ) : (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            )}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-gray-400 text-sm">Your Balance:</span>
          <span className="text-green-400 font-semibold text-lg">
            {userBalance !== undefined ? (
              `${formatTokenAmount(formatEther(userBalance))} ${tokenName}`
            ) : (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            )}
          </span>
        </div>
        {!hasEnoughBalance && userBalance !== undefined && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded text-sm">
            ⚠️ Insufficient balance to mint
          </div>
        )}
      </div>

      {/* Mint Success Message */}
      {isMintConfirmed && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">
            Warrior minted successfully! Your balance will update shortly...
          </span>
        </div>
      )}

      {/* Error Messages */}
      {/* Combine read errors into one user-friendly message */}
      {(priceError ||
        tokenAddressError ||
        balanceError ||
        nftBalanceError ||
        allowanceError) && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
          ⚠️ Unable to load minting information. Please check your connection
          and try again.
        </div>
      )}

      {/* Write contract errors - simplified user-friendly messages */}
      {approveError && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {approveError.message.includes("rejected") ||
          approveError.message.includes("denied")
            ? "❌ Transaction was cancelled"
            : approveError.message.includes("insufficient")
            ? "❌ Insufficient funds for transaction"
            : "❌ Approval failed. Please try again."}
        </div>
      )}
      {mintError && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {mintError.message.includes("rejected") ||
          mintError.message.includes("denied")
            ? "❌ Transaction was cancelled"
            : mintError.message.includes("insufficient")
            ? "❌ Insufficient funds to mint"
            : "❌ Minting failed. Please try again."}
        </div>
      )}

      {/* Single Unified Mint Button */}
      <div className="space-y-3">
        <button
          onClick={() => {
            // Reset error state on retry
            if (flowState === "error") {
              setFlowState("idle");
            }
            handleMintClick();
          }}
          disabled={isButtonDisabled}
          className="w-full cursor-pointer bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Sword className="w-5 h-5" />
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}
