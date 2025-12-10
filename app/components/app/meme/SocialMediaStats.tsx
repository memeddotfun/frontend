import { useEffect } from "react";
import {
  HeartIcon,
  MessageSquareIcon,
  RepeatIcon,
  TrendingUp,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  useTokenEngagement,
  type LensEngagementMetrics,
  type InstagramEngagementScore,
} from "@/hooks/api/useMemedApi";

/**
 * SocialMediaStats Component
 *
 * Displays multi-platform social engagement metrics for a token.
 * Supports LENS and INSTAGRAM platforms with their actual data structures.
 *
 * @param tokenAddress - The token contract address to fetch engagement for
 */
interface SocialMediaStatsProps {
  tokenAddress?: string;
}

const SocialMediaStats = ({ tokenAddress }: SocialMediaStatsProps) => {
  // Fetch multi-platform engagement data from API
  const { data: engagementData, loading, error } = useTokenEngagement(tokenAddress);

  // Log engagement data for debugging and verification
  useEffect(() => {
    if (engagementData) {
    }
  }, [engagementData, tokenAddress]);

  // Helper function to format large numbers (e.g., 1500 → 1.5K, 2000000 → 2M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Helper function to render Lens platform engagement metrics
  // Lens returns: { reactions, comments, reposts }
  const renderLensEngagement = (engagement: LensEngagementMetrics) => {
    const lensStats = [
      {
        label: "Reactions",
        value: formatNumber(engagement.reactions),
        icon: <HeartIcon className="w-5 h-5" />,
        description: "Total likes/reactions"
      },
      {
        label: "Comments",
        value: formatNumber(engagement.comments),
        icon: <MessageSquareIcon className="w-5 h-5" />,
        description: "Total comments"
      },
      {
        label: "Reposts",
        value: formatNumber(engagement.reposts),
        icon: <RepeatIcon className="w-5 h-5" />,
        description: "Total mirrors/reposts"
      },
    ];

    return (
      <div className="space-y-4">
        {/* Lens Platform Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-lg">🌿</span>
          </div>
          <h3 className="text-green-400 font-semibold text-lg">Lens Protocol</h3>
        </div>

        {/* Lens Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {lensStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-green-900/40 border border-green-500/30 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-green-900/60 transition-colors"
              title={stat.description}
            >
              <div className="text-green-500 mb-2">{stat.icon}</div>
              <div className="text-green-400 font-semibold text-xl">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render Instagram platform engagement score
  // Instagram returns a single number representing total engagement
  const renderInstagramEngagement = (engagement: InstagramEngagementScore) => {
    return (
      <div className="space-y-4">
        {/* Instagram Platform Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
            <span className="text-lg">📱</span>
          </div>
          <h3 className="text-pink-400 font-semibold text-lg">Instagram</h3>
        </div>

        {/* Instagram Total Engagement Score */}
        <div className="bg-pink-900/40 border border-pink-500/30 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-pink-900/60 transition-colors">
          <BarChart3 className="w-8 h-8 text-pink-500 mb-3" />
          <div className="text-pink-400 font-bold text-3xl mb-2">
            {formatNumber(engagement)}
          </div>
          <div className="text-sm text-neutral-400 text-center">
            Total Engagement Score
          </div>
          <div className="text-xs text-neutral-500 mt-1 text-center">
            Combined metric from impressions, reach, and interactions
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-xl">
      {/* Main Header */}
      <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="text-green-500" /> Social Media Engagement
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8 text-neutral-400 bg-red-500/10 border border-red-500/30 rounded-lg">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-sm">Unable to load engagement data</p>
          {tokenAddress && (
            <p className="text-xs mt-1 text-neutral-500">Token: {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}</p>
          )}
        </div>
      )}

      {/* No Token Address Provided */}
      {!tokenAddress && !loading && (
        <div className="text-center py-8 text-neutral-400 bg-neutral-800/50 rounded-lg">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
          <p className="text-sm">No token address available</p>
        </div>
      )}

      {/* No Engagement Data (Creator has no social accounts linked) */}
      {!loading && !error && engagementData && engagementData.engagements.length === 0 && (
        <div className="text-center py-8 text-neutral-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
          <p className="text-sm font-medium text-yellow-300 mb-2">No Social Accounts Connected</p>
          <p className="text-xs text-neutral-400">
            The creator hasn't linked any social accounts (Lens or Instagram) yet.
          </p>
        </div>
      )}

      {/* Data Display - Render each platform's engagement metrics */}
      {!loading && !error && engagementData && engagementData.engagements.length > 0 && (
        <div className="space-y-6">
          {engagementData.engagements.map((platformData, index) => (
            <div key={`${platformData.type}-${index}`}>
              {/* Render Lens engagement metrics (reactions, comments, reposts) */}
              {platformData.type === "LENS" &&
                typeof platformData.engagement === 'object' &&
                renderLensEngagement(platformData.engagement as LensEngagementMetrics)
              }

              {/* Render Instagram engagement score (single number) */}
              {platformData.type === "INSTAGRAM" &&
                typeof platformData.engagement === 'number' &&
                renderInstagramEngagement(platformData.engagement as InstagramEngagementScore)
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialMediaStats;
