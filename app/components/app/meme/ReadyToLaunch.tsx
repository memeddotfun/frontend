import { RocketIcon, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { formatEther } from "viem";
import { useRaiseEth } from "@/hooks/contracts/useMemedTokenSale";

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

interface ReadyToLaunchProps {
  tokenId: bigint;
  fairLaunchData?: readonly [number, bigint, bigint, bigint, string, bigint];
}

const ReadyToLaunch = ({ tokenId, fairLaunchData }: ReadyToLaunchProps) => {
  // Get target amount from contract
  const { data: raiseTarget } = useRaiseEth();
  const TARGET_ETH = raiseTarget || 40n * 10n ** 18n;

  if (!fairLaunchData) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <div className="text-neutral-400">Loading launch data...</div>
      </div>
    );
  }

  // Destructure the array response
  // [status, fairLaunchStartTime, totalCommitted, totalSold, uniswapPair, createdAt]
  const status = fairLaunchData[0];
  const totalCommitted = fairLaunchData[2];
  const totalSold = fairLaunchData[3];
  const fairLaunchStartTime = fairLaunchData[1];
  const uniswapPair = fairLaunchData[4];

  // Calculate oversubscription if launch exceeded target
  const isOversubscribed = totalCommitted > TARGET_ETH;
  const oversubscriptionPercentage = isOversubscribed
    ? Number(((totalCommitted - TARGET_ETH) * 100n) / TARGET_ETH)
    : 0;

  // Log for debugging

  return (
    <div className="bg-neutral-900 border border-green-500/50 p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-500/20 rounded-full">
          <RocketIcon className="text-green-400" size={24} />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">Ready to Launch! 🚀</h2>
          <p className="text-green-400 text-sm">Fair launch target achieved</p>
        </div>
      </div>

      {/* Oversubscription Notice - Shows if launch exceeded target */}
      {isOversubscribed && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-orange-400 font-semibold text-sm mb-1">
                Launch Oversubscribed by {oversubscriptionPercentage.toFixed(1)}%
              </div>
              <div className="text-neutral-300 text-xs space-y-1">
                <div>
                  This launch exceeded its {formatTokenAmount(formatEther(TARGET_ETH))} ETH target,
                  reaching {formatTokenAmount(formatEther(totalCommitted))} ETH total.
                </div>
                <div>
                  Tokens will be allocated proportionally to all participants, and excess
                  ETH will be automatically refunded when claiming.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Achievement Stats */}
      <div className="bg-neutral-900/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className={isOversubscribed ? "text-orange-400" : "text-green-400"} size={16} />
              <span className={`text-sm font-medium ${isOversubscribed ? "text-orange-400" : "text-green-400"}`}>
                {isOversubscribed ? "Oversubscribed!" : "Target Achieved"}
              </span>
            </div>
            <div className="text-white text-lg font-semibold">
              {formatTokenAmount(formatEther(totalCommitted))} ETH
            </div>
            <div className="text-neutral-400 text-xs">
              Total Committed
              {isOversubscribed && (
                <span className="text-orange-400 ml-1">
                  ({Number((totalCommitted * 100n) / TARGET_ETH)}% of target)
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-green-400 text-sm font-medium">Tokens Reserved</span>
            </div>
            <div className="text-white text-lg font-semibold">
              {formatTokenAmount(formatEther(totalSold))}
            </div>
            <div className="text-neutral-400 text-xs">MEME Tokens</div>
          </div>
        </div>
      </div>

      {/* Launch Information */}
      <div className="space-y-4">
        <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-neutral-400" size={16} />
            <span className="text-neutral-300 font-medium">Launch Status</span>
          </div>
          <div className="text-white text-sm">
            Fair launch completed successfully! The project is now ready for the official launch phase.
          </div>
          {fairLaunchStartTime > 0n && (
            <div className="text-neutral-400 text-xs mt-2">
              Fair launch started: {new Date(Number(fairLaunchStartTime) * 1000).toLocaleString()}
            </div>
          )}
        </div>

        <div className="bg-yellow-500/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg">
          <div className="text-sm font-medium mb-2">⚠️ Important Notice</div>
          <div className="text-xs space-y-1">
            <div>• Commitments and cancellations are no longer allowed</div>
            <div>• All committed funds are locked until official launch</div>
            <div>• Token claiming will be available once status changes to "Launched"</div>
            <div>• Stay tuned for launch announcements</div>
          </div>
        </div>

        {/* Developer Debug Info */}
        <div className="bg-blue-500/20 border border-blue-600 text-blue-300 p-4 rounded-lg">
          <div className="text-sm font-medium mb-2">🔧 Debug Info</div>
          <div className="text-xs space-y-1 font-mono">
            <div>Status: {status} (0=NOT_STARTED, 1=ACTIVE, 2=COMPLETED, 3=FAILED)</div>
            <div>Token ID: {tokenId.toString()}</div>
            <div>Total Committed: {totalCommitted.toString()} wei</div>
            <div>Uniswap Pair: {uniswapPair === "0x0000000000000000000000000000000000000000" ? "Not created yet" : uniswapPair}</div>
            <div className="text-yellow-300 mt-2">
              ⚠️ NOTE: With the correct enum, status 2 (COMPLETED) should show the claim panel.
              This "Ready to Launch" screen should not appear for status 2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadyToLaunch;