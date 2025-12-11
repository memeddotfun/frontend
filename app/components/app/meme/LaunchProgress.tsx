import { TargetIcon, AlertTriangle } from "lucide-react";
import {
  useFairLaunchData,
  useGetFairLaunchStatus,
  useValidateFairLaunchId,
  useCurrentId,
  useRaiseEth,
} from "@/hooks/contracts/useMemedTokenSale";
import { formatEther } from "viem";
import { useChainId, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { getChainConfig } from "@/config/chains";
import CountdownTimer from "./CountdownTimer";
import { useWeiToUsd } from "@/hooks/contracts/useChainlinkPriceFeed";

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

interface LaunchProgressProps {
  tokenId: bigint;
  key?: string; // Add key prop to force re-render when data changes
}

const LaunchProgress = ({ tokenId }: LaunchProgressProps) => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Get active chain from config (automatically handles dev vs prod)
  const activeChain = getChainConfig().chains[0];

  // Check if we're on the correct network
  const isCorrectNetwork = chainId === activeChain.id;

  // Automatically switch to correct chain if on wrong network
  useEffect(() => {
    if (!isCorrectNetwork && switchChain) {
      switchChain({ chainId: activeChain.id });
    }
  }, [isCorrectNetwork, switchChain, activeChain.id, activeChain.name]);

  // First validate if the fair launch ID exists
  const { isValid, isLoading: validationLoading, currentMaxId } = useValidateFairLaunchId(tokenId);
  const { data: currentId } = useCurrentId();
  
  // Only fetch data if ID is valid
  const { data: fairLaunchData, isLoading, error } = useFairLaunchData(tokenId);
  const { data: launchStatus } = useGetFairLaunchStatus(tokenId);

  // Get target from contract instead of hardcoding
  // This makes the component dynamic and adaptable to contract changes
  const { data: raiseTarget } = useRaiseEth();
  const TARGET_ETH = raiseTarget || 40n * 10n ** 18n; // Use contract value, fallback to 40 ETH
  
  // Destructure the array response from fairLaunchData
  // [status, fairLaunchStartTime, totalCommitted, totalSold, uniswapPair, createdAt]
  const totalCommitted = fairLaunchData ? fairLaunchData[2] : 0n;
  const totalSold = fairLaunchData ? fairLaunchData[3] : 0n;
  const fairLaunchStartTime = fairLaunchData ? fairLaunchData[1] : 0n;
  const fairLaunchStatus = fairLaunchData ? fairLaunchData[0] : 0;
  
  // Convert to USD for display
  const totalCommittedUsd = useWeiToUsd(totalCommitted);
  const targetUsd = useWeiToUsd(TARGET_ETH);
  
  // Calculate progress percentage (can exceed 100% for oversubscription)
  const progressPercentage = TARGET_ETH > 0n
    ? Number((totalCommitted * 100n) / TARGET_ETH)
    : 0;

  // Calculate oversubscription if launch exceeds target
  const isOversubscribed = totalCommitted > TARGET_ETH;
  const oversubscriptionPercentage = isOversubscribed
    ? Number(((totalCommitted - TARGET_ETH) * 100n) / TARGET_ETH)
    : 0;


  // Show network error if on wrong chain (fallback UI if auto-switch fails)
  if (!isCorrectNetwork) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl border border-red-500">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <AlertTriangle className="text-red-500" />
          Wrong Network
        </h2>
        <div className="space-y-3">
          <div className="text-red-400 text-sm">
            Contract is deployed on {activeChain.name}.
            <br />
            <span className="text-neutral-400 text-xs">
              Current network: Chain ID {chainId}
              <br />
              Required network: {activeChain.name} (Chain ID {activeChain.id})
            </span>
          </div>
          <button
            onClick={() => switchChain?.({ chainId: activeChain.id })}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-neutral-700 cursor-pointer"
          >
            Switch to {activeChain.name}
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while validating
  if (validationLoading) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TargetIcon />
          Launch Progress
        </h2>
        <div className="text-neutral-400">Validating fair launch ID...</div>
      </div>
    );
  }

  // Show specific error for invalid ID
  // Only show error when data is fully loaded to prevent flash during initial load
  if (!isValid && currentMaxId !== undefined && !isLoading) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TargetIcon />
          Launch Progress
        </h2>
        <div className="text-red-400 text-sm">
          Invalid Fair Launch ID: {tokenId.toString()}
          <br />
          <span className="text-neutral-400 text-xs">
            Valid range: 1 to {currentMaxId.toString()}
            <br />
            This fair launch may not exist in the contract yet.
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    // Show user-friendly error message instead of crashing
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TargetIcon />
          Launch Progress
        </h2>
        <div className="text-yellow-500 text-sm">
          Fair launch data not available for token ID: {tokenId.toString()}
          <br />
          <span className="text-neutral-400 text-xs">
            Contract error: {error.message || 'Unknown error'}
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TargetIcon />
          Launch Progress
        </h2>
        <div className="text-neutral-400">Loading fair launch data...</div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 p-6 rounded-xl">
      <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
        <TargetIcon />
        Launch Progress
      </h2>

      {/* Countdown Timer - Shows time remaining for fair launch */}
      <div className="mb-6">
        <CountdownTimer tokenId={tokenId} />
      </div>

      {/* Progress Bar - Shows commitment progress, changes color when oversubscribed */}
      <div className="w-full bg-neutral-800 h-3 rounded-full mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            isOversubscribed
              ? 'bg-gradient-to-r from-yellow-500 to-orange-400 shadow-lg shadow-orange-500/20'
              : 'bg-gradient-to-r from-green-500 to-green-400 shadow-lg shadow-green-500/20'
          }`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-neutral-400 mb-2">
        <span>
          {progressPercentage.toFixed(1)}% Complete
          {totalCommittedUsd && <span className="text-green-400 ml-1">({totalCommittedUsd})</span>}
        </span>
        <span>
          {formatTokenAmount(formatEther(totalCommitted))} / {formatTokenAmount(formatEther(TARGET_ETH))} ETH
        </span>
      </div>

      {/* Oversubscription Notice - Shows when commitment exceeds target */}
      {isOversubscribed && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-orange-400 font-semibold text-sm mb-1">
                Oversubscribed by {oversubscriptionPercentage.toFixed(1)}%
              </div>
              <div className="text-neutral-300 text-xs">
                This launch has exceeded its {formatTokenAmount(formatEther(TARGET_ETH))} ETH target.
                Tokens will be allocated proportionally and excess ETH will be refunded to participants.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Raised - Full width display */}
      <div className="bg-neutral-800 rounded-lg p-4 text-center">
        <div className="text-white text-2xl font-semibold">
          {totalCommitted > 0n
            ? `${formatTokenAmount(formatEther(totalCommitted))} ETH`
            : "0 ETH"
          }
        </div>
        {totalCommittedUsd && (
          <div className="text-green-400 text-sm font-medium">{totalCommittedUsd}</div>
        )}
        <div className="text-sm text-neutral-400">Total Raised</div>
      </div>

      {/* Launch Status */}
      {fairLaunchData && (
        <div className="mt-4 text-center">
          <div className="text-xs text-neutral-400">
            Status: {fairLaunchStatus === 0 ? "Active" : 
                     fairLaunchStatus === 1 ? "Ongoing" :
                     fairLaunchStatus === 2 ? "Failed" : "Ended"}
          </div>
          {fairLaunchStartTime > 0n && (
            <div className="text-xs text-neutral-400 mt-1">
              Started: {new Date(Number(fairLaunchStartTime) * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LaunchProgress;
