import { useLoaderData } from "react-router";
import { useMemo, useState } from "react";
import { Intro } from "@/components/app/explore/Intro";
import { MemeTokensList } from "@/components/app/explore/MemeTokensList";
import { Leaderboard } from "@/components/app/explore/Leaderboard";
import { UnclaimedTokensList } from "@/components/app/explore/UnclaimedTokensList";
import meme from "@/assets/images/meme.png";
import { HorizontalCard } from "@/components/app/explore/HorizontalCard";
import { memeTokensLoader, type LoaderData } from "@/lib/api/loaders";
import type { Token } from "@/hooks/api/useAuth";
import { Unlock, Grid3x3 } from "lucide-react";

// Export the loader for this route, following the project convention
export { memeTokensLoader as loader };

export default function Explore() {
  // Use the data loaded by the loader
  const { data: loadedTokens, error } = useLoaderData() as LoaderData<Token[]>;

  // Tab state for switching between all tokens and unclaimed tokens
  const [activeTab, setActiveTab] = useState<"all" | "unclaimed">("all");

  // Adapt the loaded data to the format expected by the MemeTokenCard component
  const memeTokens = (loadedTokens || []).map((token) => ({
    id: token.id,
    name: token.metadata?.name || "Unnamed Token", // Real token name
    creator: token.userId && typeof token.userId === 'string' && token.userId.length >= 4
      ? `user...${token.userId.slice(-4)}`
      : "Unknown", // Real user ID (shortened) with safe null checks
    ticker: token.metadata?.ticker || "UNKN", // Real ticker symbol
    description: token.metadata?.description || "No description", // Real description
    price: 0, // TODO: Calculate from fair launch data
    marketCap: "N/A", // TODO: Calculate from fair launch data
    progress: 0, // TODO: Calculate from fair launch data
    active: false, // TODO: Determine from fair launch status
    badge: "New", // Placeholder
    badgeColor: "bg-blue-500", // Placeholder
    image: token.metadata?.imageKey || meme, // Real image from metadata
    fairLaunchId: token.fairLaunchId, // Real fair launch ID
    address: token.address, // Token contract address (if deployed)
    createdAt: token.createdAt, // Token creation timestamp for sorting
  }));

  // Create leaderboard from real token data sorted by heat score
  // This generates the top 5 tokens by heat for the leaderboard display
  const leaderboard = useMemo(() => {
    if (!loadedTokens || loadedTokens.length === 0) {
      return [];
    }

    // Sort tokens by heat (descending) and take top 5
    // Heat is stored in token.heat from the contract
    return [...loadedTokens]
      .filter((token) => token.heat !== undefined && token.heat !== null)
      .sort((a, b) => {
        const heatA = typeof a.heat === 'bigint' ? Number(a.heat) : a.heat || 0;
        const heatB = typeof b.heat === 'bigint' ? Number(b.heat) : b.heat || 0;
        return heatB - heatA; // Descending order
      })
      .slice(0, 5) // Top 5
      .map((token, index) => ({
        id: token.id || index + 1,
        rank: index + 1,
        name: token.metadata?.name || "Unnamed Token",
        username: token.userId && typeof token.userId === 'string' && token.userId.length >= 8
          ? `@${token.userId.slice(0, 8)}...`
          : "@unknown",
        image: token.metadata?.imageKey || meme,
        score: typeof token.heat === 'bigint' ? Number(token.heat) : token.heat || 0,
        engagement: typeof token.heat === 'bigint'
          ? Number(token.heat) >= 1000
            ? `${(Number(token.heat) / 1000).toFixed(1)}K`
            : String(Number(token.heat))
          : "0",
      }));
  }, [loadedTokens]);

  // Calculate platform statistics for Intro component
  const platformStats = useMemo(() => {
    if (!loadedTokens || loadedTokens.length === 0) {
      return { totalTokens: 0, totalHeat: 0 };
    }

    // Calculate total heat across all tokens
    const totalHeat = loadedTokens.reduce((sum, token) => {
      const heat = typeof token.heat === 'bigint' ? Number(token.heat) : token.heat || 0;
      return sum + heat;
    }, 0);

    return {
      totalTokens: loadedTokens.length,
      totalHeat,
    };
  }, [loadedTokens]);

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-red-500 bg-gray-900 p-4 rounded-lg">
        <p className="text-lg">Error loading tokens: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  w-full">
      <div className=" px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full ">
        <Intro totalTokens={platformStats.totalTokens} totalHeat={platformStats.totalHeat} />

        {/* Tabs for switching between all tokens and unclaimed tokens */}
        <div className="flex gap-2 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "all"
                ? "border-green-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-300"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            All Tokens
          </button>
          <button
            onClick={() => setActiveTab("unclaimed")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "unclaimed"
                ? "border-yellow-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-300"
            }`}
          >
            <Unlock className="w-4 h-4" />
            Unclaimed
          </button>
        </div>

        {/* Conditional rendering based on active tab */}
        {activeTab === "all" ? (
          <>
            {/* Trending tokens carousel - shows top tokens by heat */}
            <div className="overflow-x-auto w-full scrollbar-hide pb-4 mb-4">
              <div className="flex gap-4  w-full overflow-x-auto">
                {memeTokens.slice(0, 7).map((token) => (
                  <HorizontalCard
                    key={token.id}
                    name={token.name}
                    creator={token.creator}
                    price={token.marketCap || "N/A"}
                  />
                ))}
                {memeTokens.length === 0 && (
                  <div className="text-neutral-500 text-sm">No tokens available</div>
                )}
              </div>
            </div>
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 xl:gap-8 w-full">
              {/* Claimed Tokens Grid */}
              <div className="flex-1 min-w-0 ">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-4 xl:gap-2">
                  {/* Claimed Tokens List - shows tokens that have been claimed */}
                  <MemeTokensList tokens={memeTokens} />

                  {/* Heat Score Leaderboard - always second, beside on xl screens */}
                  <Leaderboard items={leaderboard} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Unclaimed Tokens Section - Shows tokens waiting to be claimed */}
            {loadedTokens && loadedTokens.length > 0 && (
              <UnclaimedTokensList tokens={loadedTokens} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
