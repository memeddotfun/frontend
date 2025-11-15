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
import { baseSepolia } from "wagmi/chains";
import CountdownTimer from "./CountdownTimer";

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
  
  // Check if we're on the correct network
  const isCorrectNetwork = chainId === baseSepolia.id;
  
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
  
  const progressPercentage = TARGET_ETH > 0n
    ? Math.min(Number((totalCommitted * 100n) / TARGET_ETH), 100)
    : 0;

  // Show network error if on wrong chain
  if (!isCorrectNetwork) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl border border-red-500">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <AlertTriangle className="text-red-500" />
          Wrong Network
        </h2>
        <div className="space-y-3">
          <div className="text-red-400 text-sm">
            Contract is deployed on Base Sepolia testnet.
            <br />
            <span className="text-neutral-400 text-xs">
              Current network: Chain ID {chainId}
              <br />
              Required network: Base Sepolia (Chain ID {baseSepolia.id})
            </span>
          </div>
          <button
            onClick={() => switchChain?.({ chainId: baseSepolia.id })}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Switch to Base Sepolia
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
  if (!isValid && currentMaxId !== undefined) {
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

      {/* Progress Bar - Updated with green theme for success/commitment tracking */}
      <div className="w-full bg-neutral-800 h-3 rounded-full mb-2">
        <div
          className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-300 shadow-lg shadow-green-500/20"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-neutral-400 mb-6">
        <span>{progressPercentage.toFixed(1)}% Complete ({formatTokenAmount(formatEther(totalCommitted))} ETH)</span>
        <span>
          {formatTokenAmount(formatEther(totalCommitted))} / {formatTokenAmount(formatEther(TARGET_ETH))} ETH
        </span>
      </div>

      {/* Stats Grid - Display formatted token amounts for better readability */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-800 rounded-lg p-4 text-center">
          <div className="text-green-400 text-2xl font-semibold">
            {totalSold > 0n ? formatTokenAmount(formatEther(totalSold)) : "0"}
          </div>
          <div className="text-sm text-neutral-400">Tokens Sold</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4 text-center">
          <div className="text-blue-400 text-2xl font-semibold">
            {totalCommitted > 0n
              ? `${formatTokenAmount(formatEther(totalCommitted))} ETH`
              : "0 ETH"
            }
          </div>
          <div className="text-sm text-neutral-400">Total Committed</div>
        </div>
      </div>

      {/* Launch Status */}
      {fairLaunchData && (
        <div className="mt-4 text-center">
          <div className="text-xs text-neutral-400">
            Status: {fairLaunchStatus === 0 ? "Active" : 
                     fairLaunchStatus === 1 ? "Successful" :
                     fairLaunchStatus === 2 ? "Failed" : "Unknown"}
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
