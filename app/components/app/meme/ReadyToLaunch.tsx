import { RocketIcon, CheckCircle, Clock } from "lucide-react";
import { formatEther } from "viem";

interface ReadyToLaunchProps {
  tokenId: bigint;
  fairLaunchData?: readonly [number, bigint, bigint, bigint, string, bigint];
}

const ReadyToLaunch = ({ tokenId, fairLaunchData }: ReadyToLaunchProps) => {
  if (!fairLaunchData) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <div className="text-neutral-400">Loading launch data...</div>
      </div>
    );
  }

  // Destructure the array response
  // [status, fairLaunchStartTime, totalCommitted, totalSold, uniswapPair, createdAt]
  const totalCommitted = fairLaunchData[2];
  const totalSold = fairLaunchData[3];
  const fairLaunchStartTime = fairLaunchData[1];

  return (
    <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/50 p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-500/20 rounded-full">
          <RocketIcon className="text-green-400" size={24} />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">Ready to Launch! 🚀</h2>
          <p className="text-green-400 text-sm">Fair launch target achieved</p>
        </div>
      </div>

      {/* Launch Achievement Stats */}
      <div className="bg-neutral-900/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-green-400 text-sm font-medium">Target Achieved</span>
            </div>
            <div className="text-white text-lg font-semibold">
              {formatEther(totalCommitted)} ETH
            </div>
            <div className="text-neutral-400 text-xs">Total Committed</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-green-400 text-sm font-medium">Tokens Reserved</span>
            </div>
            <div className="text-white text-lg font-semibold">
              {formatEther(totalSold)}
            </div>
            <div className="text-neutral-400 text-xs">MEME Tokens</div>
          </div>
        </div>
      </div>

      {/* Launch Information */}
      <div className="space-y-4">
        <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-400" size={16} />
            <span className="text-blue-400 font-medium">Launch Status</span>
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
      </div>
    </div>
  );
};

export default ReadyToLaunch;