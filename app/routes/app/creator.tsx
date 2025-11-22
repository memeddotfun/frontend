import { useState, useEffect } from "react";
import {
  Coins,
  Activity,
  Lock,
  Unlock,
  TrendingUp,
  Loader2,
  CheckCircle,
  Flame,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useAuthStore } from "@/store/auth";
import {
  useCreatorData,
  useClaimCreatorIncentives,
} from "@/hooks/contracts/useMemedEngageToEarn";
import { useCreatorActivity } from "@/hooks/contracts/useCreatorActivity";
import { useTokenHeat } from "@/hooks/contracts/useMemedFactory";
import { ConnectWalletPrompt } from "@/components/shared/ConnectWalletPrompt";

export default function CreatorDashboard() {
  const { address } = useAccount();
  const { user, isLoading: isLoadingUser, isAuthenticated } = useAuthStore();

  // Token selection state
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<
    `0x${string}` | undefined
  >(undefined);

  // Set default selected token when user data loads
  useEffect(() => {
    if (user?.token && user.token.length > 0 && !selectedTokenAddress) {
      // Default to first launched token
      const firstLaunchedToken = user.token.find((t) => t.address);
      if (firstLaunchedToken?.address) {
        setSelectedTokenAddress(firstLaunchedToken.address as `0x${string}`);
      }
    }
  }, [user, selectedTokenAddress]);

  // Fetch creator data for selected token
  const {
    data: creatorData,
    isLoading: isLoadingCreatorData,
    refetch: refetchCreatorData,
  } = useCreatorData(selectedTokenAddress);
  console.log(creatorData);

  // Fetch Heat score for selected token
  const { data: heatScore, isLoading: isLoadingHeat } =
    useTokenHeat(selectedTokenAddress);

  // Fetch creator activity
  const { activityHistory, isLoading: isLoadingActivity } =
    useCreatorActivity();

  // Claim hook
  const {
    claimCreatorIncentives,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
  } = useClaimCreatorIncentives();

  // Refetch data after successful claim
  useEffect(() => {
    if (isClaimConfirmed) {
      refetchCreatorData();
    }
  }, [isClaimConfirmed, refetchCreatorData]);

  // Handle claim button click
  const handleClaim = () => {
    if (selectedTokenAddress) {
      claimCreatorIncentives(selectedTokenAddress);
    }
  };

  // Helper to format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

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

  // Get selected token details
  const selectedToken = user?.token?.find(
    (t) => t.address === selectedTokenAddress
  );
  const tokenName = selectedToken?.metadata?.name || "Token";

  // Parse creator data
  const totalBalance = creatorData ? creatorData[1] : 0n;
  const unlockedBalance = creatorData ? creatorData[2] : 0n;
  const lockedBalance = totalBalance - unlockedBalance;

  // Check if can claim (unlocking happens automatically via factory contract)
  const canClaim = unlockedBalance > 0n;

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Creator Dashboard
          </h1>
          <p className="text-gray-400">
            Build Heat across platforms to automatically unlock creator
            incentives. 100k Heat = 2M tokens!
          </p>

          {/* Token Selector */}
          {!address ? (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-4 rounded-lg">
              ⚠️ Please connect your wallet to view creator dashboard
            </div>
          ) : isLoadingUser ? (
            <div className="mt-4 flex items-center gap-2 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your tokens...
            </div>
          ) : user?.token && user.token.length > 0 ? (
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">
                Select Your Token:
              </label>
              <select
                value={selectedTokenAddress || ""}
                onChange={(e) =>
                  setSelectedTokenAddress(e.target.value as `0x${string}`)
                }
                className="bg-neutral-900 text-white px-4 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-green-500 cursor-pointer"
              >
                {user.token
                  .filter((t) => t.address)
                  .map((token) => (
                    <option key={token.id} value={token.address}>
                      {token.metadata?.name || "Unnamed Token"} (
                      {token.address?.slice(0, 6)}...{token.address?.slice(-4)})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="mt-4 bg-neutral-800 border border-neutral-700 text-neutral-400 p-4 rounded-lg">
              You haven't created any tokens yet. Launch a token to earn creator
              incentives!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:items-start">
          {/* Left Column - Creator Incentives */}
          <div className="xl:col-span-2 space-y-6">
            {/* Heat Metrics Section */}
            {selectedTokenAddress && (
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <h2 className="text-2xl font-semibold text-white">
                    Heat Score & Progress
                  </h2>
                </div>

                {isLoadingHeat && heatScore === undefined ? (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Heat data...
                  </div>
                ) : (
                  <>
                    {/* Heat Score Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-black/30 rounded-lg p-4">
                        <div className="text-sm text-neutral-400 mb-1">
                          Current Heat
                        </div>
                        <div className="text-3xl font-bold text-orange-400">
                          {heatScore ? Number(heatScore).toLocaleString() : "0"}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <div className="text-sm text-neutral-400 mb-1">
                          Next Unlock At
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {(() => {
                            const currentHeat = heatScore
                              ? Number(heatScore)
                              : 0;
                            const nextThreshold =
                              Math.ceil(currentHeat / 100000) * 100000 +
                                100000 || currentHeat + 100000;
                            return nextThreshold.toLocaleString();
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-neutral-400 mb-2">
                        <span>Progress to Next Unlock</span>
                        <span>
                          {(() => {
                            const currentHeat = heatScore
                              ? Number(heatScore)
                              : 0;
                            const nextThreshold =
                              Math.ceil(currentHeat / 100000) * 100000 ||
                              100000;
                            const previousThreshold = Math.max(
                              0,
                              nextThreshold - 100000
                            );
                            const progress =
                              nextThreshold === previousThreshold
                                ? 0
                                : ((currentHeat - previousThreshold) /
                                    (nextThreshold - previousThreshold)) *
                                  100;
                            return progress.toFixed(1);
                          })()}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(() => {
                              const currentHeat = heatScore
                                ? Number(heatScore)
                                : 0;
                              const nextThreshold =
                                Math.ceil(currentHeat / 100000) * 100000 ||
                                100000;
                              const previousThreshold = Math.max(
                                0,
                                nextThreshold - 100000
                              );
                              const progress =
                                nextThreshold === previousThreshold
                                  ? 0
                                  : ((currentHeat - previousThreshold) /
                                      (nextThreshold - previousThreshold)) *
                                    100;
                              return Math.min(100, Math.max(0, progress));
                            })()}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Heat Formula Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-neutral-400">Unlock Formula</div>
                        <div className="text-white font-semibold">
                          100,000 Heat = 2M {tokenName}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-neutral-400">Daily Limit</div>
                        <div className="text-white font-semibold">
                          Max 5M {tokenName}/Day
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Stats Cards */}
            {isLoadingCreatorData && !creatorData ? (
              <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 rounded-lg border border-neutral-800">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-neutral-400">Loading creator data...</p>
              </div>
            ) : !selectedTokenAddress ? (
              <div className="text-center py-12 text-neutral-400 bg-neutral-900 rounded-lg border border-neutral-800">
                Please select a token to view creator incentives
              </div>
            ) : (
              <>
                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Balance */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-5 h-5 text-neutral-400" />
                      <h3 className="text-sm font-medium text-gray-400">
                        Total Allocation
                      </h3>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatTokenAmount(formatEther(totalBalance))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tokenName}
                    </div>
                  </div>

                  {/* Locked Balance */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-neutral-400" />
                      <h3 className="text-sm font-medium text-gray-400">
                        Locked
                      </h3>
                    </div>
                    <div className="text-2xl font-bold text-neutral-300">
                      {formatTokenAmount(formatEther(lockedBalance))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tokenName}
                    </div>
                  </div>

                  {/* Unlocked Balance */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Unlock className="w-5 h-5 text-green-500" />
                      <h3 className="text-sm font-medium text-gray-400">
                        Available
                      </h3>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatTokenAmount(formatEther(unlockedBalance))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tokenName}
                    </div>
                  </div>
                </div>

                {/* Claim Card - Unlocking happens automatically via factory contract */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-semibold text-white">
                      Claim Earnings
                    </h2>
                  </div>

                  <p className="text-sm text-neutral-400 mb-6">
                    Claim your unlocked creator incentives to your wallet.
                    Unlocking happens automatically when you reach Heat
                    milestones.
                  </p>

                  {isClaimConfirmed && (
                    <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Incentives claimed successfully!
                      </span>
                    </div>
                  )}

                  {/* Claim button - gated behind authentication */}
                  {!isAuthenticated || !address ? (
                    <div className="w-full">
                      <ConnectWalletPrompt
                        variant="inline"
                        message="Connect your wallet to claim creator incentives"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={handleClaim}
                      disabled={!canClaim || isClaimPending || isClaimConfirming}
                      className="w-full cursor-pointer bg-green-600 hover:bg-green-700 disabled:bg-neutral-800 disabled:border-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isClaimPending || isClaimConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isClaimPending ? "Signing..." : "Claiming..."}
                        </>
                      ) : !canClaim ? (
                        "No Available Balance"
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          Claim {formatTokenAmount(
                            formatEther(unlockedBalance)
                          )}{" "}
                          {tokenName}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Enhanced Info Box */}
                <div className="bg-neutral-800 border border-neutral-700 text-neutral-300 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    How Creator Economy Works
                  </h3>

                  <div className="space-y-4">
                    {/* Heat-Based Unlocking */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        🔥 Heat-Based Unlocking
                      </h4>
                      <div className="text-xs space-y-1 text-neutral-400">
                        <p>
                          • Earn tokens from Creator Incentives Pool (200M
                          total)
                        </p>
                        <p>
                          •{" "}
                          <strong className="text-orange-400">
                            100,000 Heat = 2,000,000 {tokenName}
                          </strong>{" "}
                          unlocked
                        </p>
                        <p>
                          • Maximum 5,000,000 {tokenName} can unlock per day
                        </p>
                        <p>
                          • Heat accumulates from multi-platform activity: X,
                          Instagram, YouTube, TikTok, Reddit, Discord, Lens
                        </p>
                      </div>
                    </div>

                    {/* Battle Impact */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        ⚔️ Battle Performance
                      </h4>
                      <div className="text-xs space-y-1 text-neutral-400">
                        <p>
                          •{" "}
                          <strong className="text-green-400">
                            Battle Wins:
                          </strong>{" "}
                          Reduce Heat requirement by 20% (easier unlocks)
                        </p>
                        <p>
                          •{" "}
                          <strong className="text-red-400">
                            Battle Losses:
                          </strong>{" "}
                          Increase Heat requirement by 20% (harder unlocks)
                        </p>
                        <p>
                          • Incentivizes continuous engagement and competitive
                          performance
                        </p>
                      </div>
                    </div>

                    {/* Deflationary Mechanics */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        🔥 Deflationary Mechanics
                      </h4>
                      <div className="text-xs space-y-1 text-neutral-400">
                        <p>• NFT minting burns 100% of spent tokens</p>
                        <p>
                          • Battle losses trigger burns when rewards reach zero
                        </p>
                        <p>
                          • Active participation strengthens token economics
                        </p>
                      </div>
                    </div>

                    {/* Process */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">
                        📝 Claiming Process
                      </h4>
                      <div className="text-xs space-y-1 text-neutral-400">
                        <p>
                          • <strong>Step 1:</strong> Build Heat through platform
                          activity
                        </p>
                        <p>
                          • <strong>Step 2:</strong> Factory contract
                          automatically unlocks incentives when you reach Heat
                          milestones
                        </p>
                        <p>
                          • <strong>Step 3:</strong> Claim unlocked tokens to
                          your wallet anytime
                        </p>
                        <p>
                          • No manual unlock needed - just build Heat and claim!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="xl:col-span-1 bg-neutral-900 rounded-lg p-6 border border-neutral-800 h-fit xl:sticky xl:top-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-white">
                Recent Activity
              </h2>
            </div>

            {/* Loading State - only show spinner when no data yet */}
            {isLoadingActivity && activityHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
                <p className="text-neutral-400 text-sm">Loading activity...</p>
              </div>
            ) : activityHistory.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">
                  No recent activity yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activityHistory.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="border-b border-neutral-800 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div
                        className={`font-medium text-sm flex items-center gap-2 ${
                          activity.type === "unlock"
                            ? "text-neutral-300"
                            : "text-green-400"
                        }`}
                      >
                        {activity.type === "unlock" ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                        {activity.type === "unlock"
                          ? "Incentives Unlocked"
                          : "Incentives Claimed"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <span className="text-white font-semibold">
                        {formatTokenAmount(formatEther(activity.amount))}{" "}
                        {tokenName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
