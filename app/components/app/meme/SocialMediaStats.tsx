import { useEffect } from "react";
import {
  EyeIcon,
  HeartIcon,
  MessageSquareIcon,
  RepeatIcon,
  Share2Icon,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useLensEngagementByHandle } from "@/hooks/api/useMemedApi";

/**
 * SocialMediaStats Component
 * Displays Lens engagement metrics for a creator's handle
 * @param lensHandle - The Lens handle to fetch engagement data for
 */
interface SocialMediaStatsProps {
  lensHandle?: string;
}

const SocialMediaStats = ({ lensHandle }: SocialMediaStatsProps) => {
  // Fetch engagement data from API
  const { data: engagement, loading, error } = useLensEngagementByHandle(lensHandle);

  // Log engagement data for verification
  useEffect(() => {
    if (engagement) {
      console.log("=== LENS ENGAGEMENT DATA ===");
      console.log("Handle:", lensHandle);
      console.log("Engagement:", engagement);
      console.log("===========================");
    }
  }, [engagement, lensHandle]);

  // Helper function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Build stats array from engagement data
  const stats = engagement
    ? [
        { label: "Likes", value: formatNumber(engagement.likes), icon: <HeartIcon /> },
        { label: "Mirrors", value: formatNumber(engagement.mirrors), icon: <RepeatIcon /> },
        { label: "Comments", value: formatNumber(engagement.comments), icon: <MessageSquareIcon /> },
        { label: "Collects", value: formatNumber(engagement.collects), icon: <EyeIcon /> },
        { label: "Score", value: formatNumber(engagement.score), icon: <Share2Icon /> },
      ]
    : [];

  return (
    <div className="bg-neutral-900 p-6 rounded-xl">
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
        <div className="text-center py-8 text-neutral-400">
          <p className="text-sm">Unable to load engagement data</p>
          {lensHandle && (
            <p className="text-xs mt-1">Handle: @{lensHandle}</p>
          )}
        </div>
      )}

      {/* No Handle Provided */}
      {!lensHandle && !loading && (
        <div className="text-center py-8 text-neutral-400">
          <p className="text-sm">No Lens handle available for this token</p>
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && engagement && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-green-900/40 rounded-lg p-4 flex flex-col items-center justify-center"
            >
              <div className="text-2xl text-green-500">{stat.icon}</div>
              <div className="text-green-400 font-semibold text-xl">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialMediaStats;
