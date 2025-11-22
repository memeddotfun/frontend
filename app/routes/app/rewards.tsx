import { useState, useEffect, useMemo } from "react";
import {
  Gift,
  Activity,
  Loader2,
  Swords,
  Shield,
  Flame,
  Clock,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useAuthStore } from "@/store/auth";
import {
  useGetUserEngagementReward,
  useClaimEngagementReward,
} from "@/hooks/contracts/useMemedEngageToEarn";
import { useRecentClaims } from "@/hooks/contracts/useRecentClaims";
import { useGetUserClaimableRewards } from "@/hooks/contracts/useMemedBattle";
import { useUserActiveNfts } from "@/hooks/contracts/useMemedWarriorNFT";
import { useGetWarriorNFT } from "@/hooks/contracts/useMemedFactory";
import { ConnectWalletPrompt } from "@/components/shared/ConnectWalletPrompt";

export default function EngagementRewards() {
  const { address } = useAccount();
  const { user, isLoading: isLoadingUser, isAuthenticated } = useAuthStore();

  // Token selection state
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<
    `0x${string}` | undefined
  >(undefined);

  // Fetch user's engagement rewards (all tokens) - must be declared before useEffect uses it
  const {
    data: rewardsData,
    isLoading: isLoadingRewards,
    refetch: refetchRewards,
  } = useGetUserEngagementReward();

  // Set default selected token when data loads
  useEffect(() => {
    if (!selectedTokenAddress && !isLoadingUser && !isLoadingRewards) {
      // Prefer token with rewards, fallback to first launched token
      if (rewardsData && rewardsData.length > 0) {
        // Find first valid token (not zero address)
        const firstValidRewardToken = rewardsData.find(
          (r) =>
            r.token &&
            r.token.toLowerCase() !==
              "0x0000000000000000000000000000000000000000"
        );

        if (firstValidRewardToken) {
          const tokenAddr =
            firstValidRewardToken.token.toLowerCase() as `0x${string}`;
          setSelectedTokenAddress(tokenAddr);
        }
      } else if (user?.token && user.token.length > 0) {
        // Fallback to first launched token (also check for zero address)
        const firstLaunchedToken = user.token.find(
          (t) =>
            t.address &&
            t.address.toLowerCase() !==
              "0x0000000000000000000000000000000000000000"
        );

        if (firstLaunchedToken?.address) {
          const tokenAddr =
            firstLaunchedToken.address.toLowerCase() as `0x${string}`;
          setSelectedTokenAddress(tokenAddr);
        }
      }
    }
  }, [
    rewardsData,
    user,
    selectedTokenAddress,
    isLoadingUser,
    isLoadingRewards,
  ]);

  // Get selected token details (moved here to use before hooks)
  const selectedToken = user?.token?.find(
    (t) => t.address === selectedTokenAddress
  );

  // Get token name - try from user.token metadata, fallback to shortened address
  const tokenName =
    selectedToken?.metadata?.name ||
    (selectedTokenAddress
      ? `${selectedTokenAddress.slice(0, 6)}...${selectedTokenAddress.slice(
          -4
        )}`
      : "Token");

  // Filter rewards by selected token (memoized to prevent unnecessary recalculations)
  const filteredRewards = useMemo(
    () =>
      rewardsData?.filter(
        (reward) =>
          reward.token.toLowerCase() === selectedTokenAddress?.toLowerCase()
      ),
    [rewardsData, selectedTokenAddress]
  );

  // Fetch recent claim activity
  const { claimHistory, isLoading: isLoadingHistory } =
    useRecentClaims(address);

  // Fetch expected battle rewards (view only)
  const { data: battleRewards, isLoading: isLoadingBattleRewards } =
    useGetUserClaimableRewards(address, selectedTokenAddress);

  // Fetch warrior NFT address for selected token from factory (works for all tokens, not just launched)
  const { data: nftAddressFromFactory } =
    useGetWarriorNFT(selectedTokenAddress);

  // Use NFT address from factory first, fallback to user.token data
  const selectedNftAddress = nftAddressFromFactory as `0x${string}`;

  const { data: activeNFTs, isLoading: isLoadingNFTs } = useUserActiveNfts(
    selectedNftAddress,
    address
  );

  // Claim hook
  const {
    claimEngagementReward,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
  } = useClaimEngagementReward();

  // Track which reward is being claimed
  const [claimingRewardId, setClaimingRewardId] = useState<bigint | null>(null);

  // Track claim in progress state to prevent button flicker
  const [claimInProgress, setClaimInProgress] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination values
  const totalPages = Math.ceil((filteredRewards?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRewards = filteredRewards?.slice(startIndex, endIndex);

  // Reset to page 1 when rewards change (e.g., different token selected)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTokenAddress]);

  // Set claim in progress when transaction starts
  useEffect(() => {
    if (isClaimPending || isClaimConfirming) {
      setClaimInProgress(true);
    }
  }, [isClaimPending, isClaimConfirming]);

  // Refetch rewards after successful claim
  useEffect(() => {
    if (isClaimConfirmed) {
      refetchRewards();
      setClaimingRewardId(null);
      setClaimInProgress(false);
    }
  }, [isClaimConfirmed, refetchRewards]);

  // Handle claim button click
  const handleClaim = (rewardId: bigint) => {
    setClaimingRewardId(rewardId);
    setClaimInProgress(true);
    claimEngagementReward(rewardId);
  };

  // Helper to format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Helper to format token amounts with K/M notation
  const formatTokenAmount = (value: string): string => {
    const num = parseFloat(value);
    if (num === 0) return "0";
    if (num < 0.01) return "<0.01";

    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(num);
  };

  return (
    <div className="min-h-screen  text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Engagement Rewards
          </h1>
          <p className="text-gray-400">
            Own Warrior NFTs to earn rewards from engagement cycles. Each NFT
            earns its own reward stream!
          </p>

          {/* Token Selector */}
          {!address ? (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-4 rounded-lg">
              ⚠️ Please connect your wallet to view rewards
            </div>
          ) : isLoadingUser ? (
            <div className="mt-4 flex items-center gap-2 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your tokens...
            </div>
          ) : (
            (() => {
              // Combine tokens from: 1) rewards data (has NFTs), 2) user's launched tokens
              const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

              const tokensWithRewards = new Set(
                rewardsData
                  ?.map((r) => r.token.toLowerCase())
                  .filter((addr) => addr && addr !== ZERO_ADDRESS) || []
              );

              const launchedTokens =
                user?.token?.filter(
                  (t) => t.address && t.address.toLowerCase() !== ZERO_ADDRESS
                ) || [];

              // Get unique token addresses from both sources
              const allTokenAddresses = Array.from(
                new Set([
                  ...Array.from(tokensWithRewards),
                  ...launchedTokens.map((t) => t.address!.toLowerCase()),
                ])
              ).filter((addr) => addr && addr !== ZERO_ADDRESS);

              if (allTokenAddresses.length > 0) {
                return (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Select Token:
                    </label>
                    <select
                      key={selectedTokenAddress || "default"}
                      value={selectedTokenAddress || ""}
                      onChange={(e) => {
                        const newAddr =
                          e.target.value.toLowerCase() as `0x${string}`;
                        setSelectedTokenAddress(newAddr);
                      }}
                      className="bg-neutral-900 text-white px-4 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-green-500 cursor-pointer"
                    >
                      {allTokenAddresses.map((tokenAddress) => {
                        // Find token metadata from user's launched tokens
                        const tokenMeta = user?.token?.find(
                          (t) => t.address?.toLowerCase() === tokenAddress
                        );
                        const hasRewards = tokensWithRewards.has(tokenAddress);

                        return (
                          <option key={tokenAddress} value={tokenAddress}>
                            {tokenMeta?.metadata?.name || "Token"} (
                            {tokenAddress.slice(0, 6)}...
                            {tokenAddress.slice(-4)}) {hasRewards ? "✓" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              } else {
                return (
                  <div className="mt-4 bg-neutral-800 border border-neutral-700 text-neutral-400 p-4 rounded-lg">
                    <p className="font-semibold mb-2">No Warrior NFTs Found</p>
                    <p className="text-sm mb-3">
                      To earn engagement rewards, you need to own Warrior NFTs.
                      Each NFT you own earns its own reward stream!
                    </p>
                    <a
                      href="/explore"
                      className="inline-block bg-green-600 hover:bg-green-700 text-black font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Explore Tokens & Mint Warriors
                    </a>
                  </div>
                );
              }
            })()
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:items-start">
          {/* Left Column - Rewards Sections */}
          <div className="xl:col-span-2 space-y-6">
            {/* Claimable Rewards Section */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-semibold text-white">
                  Claimable Rewards
                </h2>
              </div>

              {/* Loading State */}
              {isLoadingRewards ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                  <p className="text-neutral-400">Loading your rewards...</p>
                </div>
              ) : !selectedTokenAddress ? (
                <div className="text-center py-12 text-neutral-400">
                  Please select a token to view rewards
                </div>
              ) : !filteredRewards || filteredRewards.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Rewards Available
                  </h3>
                  <p className="text-neutral-400 mb-2">
                    Waiting for next engagement cycle...
                  </p>
                  <p className="text-sm text-neutral-500">
                    Rewards are distributed in cycles based on platform Heat.
                    Your {tokenName} Warriors will earn automatically!
                  </p>
                </div>
              ) : (
                <>
                  {/* Rewards Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Reward ID
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400 hidden sm:table-cell">
                            Token
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-400">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRewards?.map((reward, index) => {
                          const isClaimingThis = claimingRewardId === reward.rewardId;
                          const isProcessingThis = isClaimingThis && claimInProgress;

                          return (
                            <tr
                              key={index}
                              className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                            >
                              {/* Amount Column */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                  <div>
                                    <div className="text-green-400 font-semibold">
                                      {formatTokenAmount(
                                        formatEther(reward.amountToClaim)
                                      )}{" "}
                                      {tokenName}
                                    </div>
                                    <div className="text-xs text-neutral-500 sm:hidden">
                                      ID #{reward.rewardId.toString()}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Reward ID Column */}
                              <td className="py-4 px-4 text-neutral-300 hidden sm:table-cell">
                                #{reward.rewardId.toString()}
                              </td>

                              {/* Token Column */}
                              <td className="py-4 px-4 text-neutral-400 text-sm font-mono hidden sm:table-cell">
                                {reward.token.slice(0, 6)}...
                                {reward.token.slice(-4)}
                              </td>

                              {/* Action Column - gated behind authentication */}
                              <td className="py-4 px-4 text-right">
                                {!isAuthenticated || !address ? (
                                  <ConnectWalletPrompt variant="button" />
                                ) : (
                                  <button
                                    onClick={() => handleClaim(reward.rewardId)}
                                    disabled={isProcessingThis}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-black cursor-pointer font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2 min-w-[100px]"
                                  >
                                    {isProcessingThis ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="hidden sm:inline">
                                          {isClaimPending
                                            ? "Signing..."
                                            : "Claiming..."}
                                        </span>
                                      </>
                                    ) : (
                                      "Claim"
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-800">
                      {/* Page Info */}
                      <div className="text-sm text-neutral-400">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, filteredRewards?.length || 0)} of{" "}
                        {filteredRewards?.length || 0} rewards
                      </div>

                      {/* Page Controls */}
                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                          ← Prev
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            // Show first, last, current, and pages near current
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1;

                            if (!showPage) {
                              // Show ellipsis
                              if (page === 2 || page === totalPages - 1) {
                                return (
                                  <span
                                    key={page}
                                    className="text-neutral-500 px-2"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                  currentPage === page
                                    ? "bg-green-600 text-black font-semibold"
                                    : "bg-neutral-800 hover:bg-neutral-700"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Expected Battle Rewards Section (View Only) */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800 border-dashed">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-neutral-400" />
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Expected Battle Rewards
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    View only - Pending rewards from ongoing battles
                  </p>
                </div>
              </div>

              {!selectedTokenAddress ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  Please select a token to view rewards
                </div>
              ) : isLoadingBattleRewards ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : battleRewards && battleRewards > 0n ? (
                <div className="bg-neutral-800/50 rounded-lg p-6 border border-neutral-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-5 h-5 text-neutral-400" />
                    <span className="text-sm text-neutral-400">
                      Battle Winnings
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    ~{formatTokenAmount(formatEther(battleRewards))}{" "}
                    {tokenName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    This is an estimate. Actual rewards will be available to
                    claim through this page once battles complete.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No pending battle rewards
                </div>
              )}
            </div>

            {/* Warrior Status Section */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-neutral-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Warrior Status
                </h2>
              </div>

              {!selectedNftAddress ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  {!selectedTokenAddress
                    ? "Please select a token to view warrior status"
                    : "Loading warrior NFT data..."}
                </div>
              ) : isLoadingNFTs && !activeNFTs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : activeNFTs && activeNFTs.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-800 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-500 mb-1">
                        {activeNFTs.length}
                      </div>
                      <div className="text-sm text-neutral-400">
                        Available Warriors
                      </div>
                    </div>
                    <div className="bg-neutral-800 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-neutral-400 mb-1">
                        {/* This would require total NFT count - for now showing active */}
                        {activeNFTs.length}
                      </div>
                      <div className="text-sm text-neutral-400">
                        Total Warriors
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 mt-4">
                    ✅ Your warriors are ready for battle allocation. NFTs are
                    automatically returned after battles complete.
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm mb-3">
                    No warriors available for {tokenName}
                  </p>
                  <a
                    href={`/explore/meme/${selectedToken?.id}/mint`}
                    className="text-green-500 hover:text-green-400 text-sm underline"
                  >
                    Mint warriors to participate in battles
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="xl:col-span-1 bg-neutral-900 rounded-lg p-6 border border-neutral-800 h-fit xl:sticky xl:top-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-white">
                Recent Activity
              </h2>
            </div>

            {/* Loading State */}
            {isLoadingHistory && claimHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
                <p className="text-neutral-400 text-sm">Loading activity...</p>
              </div>
            ) : !address ? (
              <div className="text-center py-8 text-neutral-400 text-sm">
                Connect wallet to view activity
              </div>
            ) : claimHistory.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">No recent claims yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claimHistory.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className="border-b border-neutral-800 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-green-400 font-medium text-sm">
                        Reward Claimed
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
                      <span>•</span>
                      <span className="text-xs">
                        ID #{activity.rewardId.toString()}
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
