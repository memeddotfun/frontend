import { useMemo } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Wallet,
  TrendingUp,
  Trophy,
  Flame,
  Shield,
  Loader2,
  AlertCircle,
  Coins,
  Swords,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import {
  useGetBattles,
  useGetUserClaimableBattles,
} from "@/hooks/contracts/useMemedBattle";
import { useGetUserEngagementReward } from "@/hooks/contracts/useMemedEngageToEarn";
import { useTokenHeat } from "@/hooks/contracts/useMemedFactory";
import { useRecentClaims } from "@/hooks/contracts/useRecentClaims";
import { Link } from "react-router";

// Battle status enum
type BattleStatus = 0 | 1 | 2 | 3;

// Battle interface from contract
interface Battle {
  battleId: bigint;
  memeA: `0x${string}`;
  memeB: `0x${string}`;
  memeANftsAllocated: bigint;
  memeBNftsAllocated: bigint;
  heatA: bigint;
  heatB: bigint;
  startTime: bigint;
  endTime: bigint;
  challengeTime: bigint;
  status: BattleStatus;
  winner: `0x${string}`;
  totalReward: bigint;
}

// Token interface with metadata for stats display
interface TokenWithMetadata {
  id: string;
  address?: `0x${string}` | string;
  metadata?: {
    name?: string;
    ticker?: string;
    imageUrl?: string;
  };
  image?: {
    s3Key?: string;
  };
  phase?: string;
  userId?: string;
}

// Engagement reward tuple type from contract
// Structure: [rewardId, tokenAddress, amount, claimed]
type EngagementReward = [
  rewardId: bigint,
  tokenAddress: `0x${string}`,
  amount: bigint,
  claimed: boolean
];

// Component to display a single token card with real-time stats
function TokenStatsCard({ token }: { token: TokenWithMetadata }) {
  // Fetch real-time heat score for this token
  const { data: heatData, isLoading: isLoadingHeat } = useTokenHeat(
    token.address as `0x${string}`
  );
  const heat = heatData || 0n;

  return (
    <Link
      to={`/app/meme/${token.id}`}
      className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700 transition-colors cursor-pointer border-2 border-transparent hover:border-green-500/30"
    >
      {/* Token Image */}
      <div className="aspect-square w-full bg-neutral-700 rounded-lg overflow-hidden mb-3">
        {token.image?.s3Key || token.metadata?.imageUrl ? (
          <img
            src={token.image?.s3Key || token.metadata?.imageUrl}
            alt={token.metadata?.name || "Token"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎭
          </div>
        )}
      </div>

      {/* Token Info */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-lg truncate">
          {token.metadata?.name || "Unnamed Token"}
        </h3>
        <p className="text-neutral-400 text-sm">${token.metadata?.ticker || "???"}</p>

        {/* Heat Score */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-medium">Heat</span>
          </div>
          {isLoadingHeat ? (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
          ) : (
            <span className="text-white font-bold">
              {Number(heat).toLocaleString()}
            </span>
          )}
        </div>

        {/* Token Phase */}
        {token.phase && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Phase</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                token.phase === "COMPLETED"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : token.phase === "REVEAL"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              {token.phase}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MyInsights() {
  const { address } = useAccount();
  const { user, isLoading: isLoadingUser } = useAuthStore();

  // Fetch battles data to calculate user statistics
  const { data: battlesData, isLoading: isLoadingBattles } = useGetBattles();
  const battles: Battle[] = (battlesData as Battle[]) || [];

  // Fetch user's claimable battle rewards
  const { data: claimableData, isLoading: isLoadingClaimable } =
    useGetUserClaimableBattles(address);

  // Fetch user's engagement rewards
  const { data: engagementRewardData, isLoading: isLoadingEngagement } =
    useGetUserEngagementReward();

  // Fetch recent claim history (with smaller block range for faster loading)
  const { claimHistory, isLoading: isLoadingClaims, error: claimsError } = useRecentClaims(
    address,
    10000n // Only look back 10k blocks instead of 100k for faster loading
  );

  // Get user's created tokens
  const userTokens = user?.token?.filter((t) => t.userId === user.id) || [];

  // Calculate battle statistics
  const battleStats = useMemo(() => {
    if (!user || battles.length === 0) {
      return {
        totalBattles: 0,
        activeBattles: 0,
        pendingChallenges: 0,
        battlesWon: 0,
        battlesLost: 0,
        winRate: 0,
      };
    }

    // Get addresses of user's tokens
    const userTokenAddresses = userTokens.map((t) =>
      t.address?.toLowerCase()
    );

    // Filter battles involving user's tokens
    const userBattles = battles.filter(
      (battle) =>
        userTokenAddresses.includes(battle.memeA.toLowerCase()) ||
        userTokenAddresses.includes(battle.memeB.toLowerCase())
    );

    // Count active battles (STARTED status = 2)
    const activeBattles = userBattles.filter((b) => b.status === 2).length;

    // Count pending challenges (CHALLENGED status = 1, where user's token is memeB)
    const pendingChallenges = battles.filter(
      (b) =>
        b.status === 1 && userTokenAddresses.includes(b.memeB.toLowerCase())
    ).length;

    // Calculate wins and losses from completed battles
    let battlesWon = 0;
    let battlesLost = 0;

    userBattles.forEach((battle) => {
      if (battle.status === 3) {
        // RESOLVED
        const userTokenWon = userTokenAddresses.includes(
          battle.winner.toLowerCase()
        );
        if (userTokenWon) {
          battlesWon++;
        } else if (
          battle.winner !==
          ("0x0000000000000000000000000000000000000000" as `0x${string}`)
        ) {
          // Only count as loss if there was a winner (not a draw)
          battlesLost++;
        }
      }
    });

    const completedBattles = battlesWon + battlesLost;
    const winRate =
      completedBattles > 0 ? (battlesWon / completedBattles) * 100 : 0;

    return {
      totalBattles: userBattles.length,
      activeBattles,
      pendingChallenges,
      battlesWon,
      battlesLost,
      winRate: Math.round(winRate),
    };
  }, [battles, userTokens, user]);

  // Calculate pending rewards
  const pendingBattleRewards = claimableData
    ? formatEther(claimableData[2])
    : "0";

  // Parse engagement rewards (returns array of [rewardId, tokenAddress, amount, claimed])
  const engagementRewards = useMemo(() => {
    if (!engagementRewardData || !Array.isArray(engagementRewardData)) {
      return { totalPending: "0", count: 0 };
    }

    // Filter unclaimed rewards
    const unclaimedRewards = engagementRewardData.filter(
      (reward: EngagementReward) => !reward[3]
    ); // reward[3] is 'claimed' boolean

    // Sum unclaimed amounts - ensure we're working with BigInt
    let totalAmount = 0n;
    unclaimedRewards.forEach((reward: EngagementReward) => {
      const amount = BigInt(reward[2] || 0); // Ensure it's BigInt
      totalAmount = totalAmount + amount;
    });

    return {
      totalPending: formatEther(totalAmount),
      count: unclaimedRewards.length,
    };
  }, [engagementRewardData]);

  // Loading state
  const isLoading =
    isLoadingUser || isLoadingBattles || isLoadingClaimable || isLoadingEngagement;

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Insights</h1>
          <p className="text-gray-400">
            Track your MEME journey and performance
          </p>
        </div>

        {/* Wallet Not Connected State */}
        {!address ? (
          <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-6 rounded-lg text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
            <p className="text-sm">
              Please connect your wallet to view your insights and performance
              metrics.
            </p>
          </div>
        ) : (
          <>
            {/* Main Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* Portfolio Overview */}
              <div className="bg-neutral-900 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-white">
                    Portfolio Overview
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Tokens Created */}
                  <div className="text-center p-4 bg-neutral-800 rounded-lg">
                    <div className="text-3xl font-bold text-green-500 mb-1">
                      {isLoadingUser ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                      ) : (
                        userTokens.length
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Tokens Created</div>
                  </div>

                  {/* Pending Battle Rewards */}
                  <div className="text-center p-4 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoadingClaimable ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        <>
                          {parseFloat(pendingBattleRewards).toFixed(2)}
                          <span className="text-sm text-neutral-400 ml-1">
                            tokens
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">Battle Rewards</div>
                    {claimableData && claimableData[0].length > 0 && (
                      <Link
                        to="/app/rewards"
                        className="text-xs text-green-400 hover:text-green-300 mt-1 inline-block"
                      >
                        Claim Now →
                      </Link>
                    )}
                  </div>

                  {/* Engagement Rewards */}
                  <div className="text-center p-4 bg-neutral-800 rounded-lg">
                    <div className="text-2xl font-bold text-white mb-1">
                      {isLoadingEngagement ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        <>
                          {parseFloat(engagementRewards.totalPending).toFixed(2)}
                          <span className="text-sm text-neutral-400 ml-1">
                            tokens
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                      Engagement Rewards
                      {engagementRewards.count > 0 && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                          {engagementRewards.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Battle Analytics */}
              <div className="bg-neutral-900 rounded-lg p-6 xl:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <Swords className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-semibold text-white">
                    Battle Analytics
                  </h2>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : battleStats.totalBattles === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    <Swords className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                    <p>No battle history yet</p>
                    <Link
                      to="/app/battles"
                      className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block"
                    >
                      Start a Battle →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Total Battles */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-white mb-1">
                        {battleStats.totalBattles}
                      </div>
                      <div className="text-xs text-gray-400">Total Battles</div>
                    </div>

                    {/* Battles Won */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-green-500 mb-1">
                        {battleStats.battlesWon}
                      </div>
                      <div className="text-xs text-gray-400">Won</div>
                    </div>

                    {/* Battles Lost */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-red-500 mb-1">
                        {battleStats.battlesLost}
                      </div>
                      <div className="text-xs text-gray-400">Lost</div>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-white mb-1">
                        {battleStats.winRate}%
                      </div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>

                    {/* Active Battles */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {battleStats.activeBattles}
                      </div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>

                    {/* Pending Challenges */}
                    <div className="text-center p-4 bg-neutral-800 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {battleStats.pendingChallenges}
                      </div>
                      <div className="text-xs text-gray-400">Pending</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* My Tokens Section */}
            <div className="bg-neutral-900 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-white">My Tokens</h2>
                </div>
                <Link
                  to="/app/launch"
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  Launch New Token →
                </Link>
              </div>

              {isLoadingUser ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : userTokens.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Coins className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
                  <p className="mb-2">You haven't created any tokens yet</p>
                  <Link
                    to="/app/launch"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Launch Your First Token
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {userTokens.map((token) => (
                    <TokenStatsCard key={token.id} token={token as TokenWithMetadata} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Claim Activity */}
            <div className="bg-neutral-900 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-white">
                  Recent Claim Activity
                </h2>
              </div>

              {isLoadingClaims ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-2" />
                  <p className="text-sm text-neutral-400">Loading claim history...</p>
                </div>
              ) : claimsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                  <p className="text-neutral-400 text-sm mb-2">
                    Unable to load claim history
                  </p>
                  <p className="text-neutral-500 text-xs">
                    {claimsError.message || "Please try again later"}
                  </p>
                </div>
              ) : claimHistory.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                  <p>No claim history found in recent blocks</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    Claims from earlier blocks may not be shown
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claimHistory.slice(0, 10).map((claim, index) => (
                    <div
                      key={index}
                      className="bg-neutral-800 p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            Reward Claimed #{claim.rewardId.toString()}
                          </div>
                          <div className="text-neutral-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(claim.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        +{parseFloat(formatEther(claim.amount)).toFixed(4)} tokens
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
