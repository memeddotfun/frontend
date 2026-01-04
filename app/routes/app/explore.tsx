import { useLoaderData, useRevalidator, useSearchParams } from "react-router";
import { useMemo, useState, useEffect } from "react";
import { Intro } from "@/components/app/explore/Intro";
import { MemeTokensList } from "@/components/app/explore/MemeTokensList";
import { Leaderboard } from "@/components/app/explore/Leaderboard";
import meme from "@/assets/images/meme.png";
import { HorizontalCard } from "@/components/app/explore/HorizontalCard";
import { memeTokensLoader, type LoaderData } from "@/lib/api/loaders";
import type { Token } from "@/hooks/api/useAuth";
import {
  Unlock,
  Grid3x3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTokensBatchData } from "@/hooks/contracts/useTokensBatchData";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { useTokensLeaderboard } from "@/hooks/api/useMemedApi";
import { useEthUsdPrice } from "@/hooks/contracts/useChainlinkPriceFeed";

// Export the loader for this route, following the project convention
export { memeTokensLoader as loader };

export default function Explore() {
  // Use the data loaded by the loader - now includes pagination
  const loaderData = useLoaderData() as LoaderData<{
    tokens: Token[];
    pagination: any;
  }>;
  const loadedTokens = loaderData.data?.tokens || [];
  const pagination = loaderData.data?.pagination;
  const error = loaderData.error;
  
  // Get ETH price for USD conversion in carousel
  const { data: ethPriceData } = useEthUsdPrice();

  // URL search params for pagination
  const [searchParams, setSearchParams] = useSearchParams();

  // Revalidator hook to refetch data from loader
  const revalidator = useRevalidator();

  // Initialize active tab from URL params (if present) or default to "claimed"
  // This ensures the tab state matches the URL on initial render and navigation
  const initialTab = useMemo(() => {
    const claimedParam = searchParams.get("claimed");
    if (claimedParam === "false") return "unclaimed";
    return "claimed"; // Default to 'claimed' (claimed tokens)
  }, [searchParams.get("claimed")]);

  // Tab state for switching between claimed and unclaimed tokens
  const [activeTab, setActiveTab] = useState<"claimed" | "unclaimed">(
    initialTab
  );

  // Detect if loaded data doesn't match the active tab
  // This is more reliable than checking URL since URL updates are async
  const isStaleData = useMemo(() => {
    if (!loadedTokens || loadedTokens.length === 0) {
      console.log("🔍 Stale check: No tokens loaded");
      return false;
    }

    // Check if first token's claimed status matches active tab
    // If tab is "claimed", tokens should be claimed (true)
    // If tab is "unclaimed", tokens should be unclaimed (false)
    const expectedClaimed = activeTab === "claimed";
    const firstToken = loadedTokens[0];

    if (!firstToken) {
      console.log("🔍 Stale check: No first token");
      return false;
    }

    const isStale = firstToken.claimed !== expectedClaimed;
    console.log("🔍 Stale check:", {
      activeTab,
      expectedClaimed,
      actualClaimed: firstToken.claimed,
      tokenName: firstToken.metadata?.name,
      isStale,
    });

    // If data doesn't match active tab, it's stale
    return isStale;
  }, [loadedTokens, activeTab]);

  // Show loading state during navigation or when data is stale
  const isLoading = revalidator.state === "loading" || isStaleData;

  // Sync activeTab state with URL params when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const claimedParam = searchParams.get("claimed");
    const expectedTab = claimedParam === "false" ? "unclaimed" : "claimed";

    // Only sync if not already in the expected state (to avoid loops)
    if (activeTab !== expectedTab) {
      console.log("🔄 Syncing tab with URL:", {
        claimedParam,
        expectedTab,
        currentTab: activeTab,
      });
      setActiveTab(expectedTab);
    }
  }, [searchParams.get("claimed")]);

  // Initialize URL params on mount if not present
  useEffect(() => {
    const currentClaimed = searchParams.get("claimed");
    const currentPage = searchParams.get("page");

    // Set default params if they're missing
    if (!currentClaimed || !currentPage) {
      setSearchParams(
        {
          page: currentPage || "1",
          claimed: currentClaimed || "true",
        },
        { replace: true }
      );
    }
  }, []); // Only run on mount

  // State for tab counts
  const [claimedCount, setClaimedCount] = useState<number>(0);
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0);

  // Fetch counts for both tabs
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch claimed count
        const claimedResponse = await apiClient.get<{
          tokens: any[];
          pagination: any;
        }>(`${API_ENDPOINTS.TOKENS}?claimed=true&limit=1`);
        setClaimedCount(claimedResponse.data?.pagination?.totalCount || 0);

        // Fetch unclaimed count
        const unclaimedResponse = await apiClient.get<{
          tokens: any[];
          pagination: any;
        }>(`${API_ENDPOINTS.TOKENS}?claimed=false&limit=1`);
        setUnclaimedCount(unclaimedResponse.data?.pagination?.totalCount || 0);
      } catch (error) {
        console.error("Error fetching tab counts:", error);
      }
    };

    fetchCounts();
  }, [revalidator.state]); // Refetch counts when data is revalidated

  // Sync active tab with URL search params for proper backend filtering
  useEffect(() => {
    const currentPage = "1"; // Reset to page 1 when switching tabs
    const claimed = activeTab === "claimed" ? "true" : "false";

    // Only update if the URL params don't match the expected values
    const currentClaimed = searchParams.get("claimed");
    if (currentClaimed !== claimed) {
      console.log("=== TAB SWITCH - UPDATING URL ===");
      console.log("Active Tab:", activeTab);
      console.log("Current URL claimed:", currentClaimed);
      console.log("Setting URL params to:", { page: currentPage, claimed });

      // Update URL params - this triggers a navigation which will call the loader
      setSearchParams({ page: currentPage, claimed }, { replace: true });
    }
  }, [activeTab]); // Only depend on activeTab, not setSearchParams

  // Debug logging - see what data we're getting from the API
  useEffect(() => {
    console.log("=== EXPLORE PAGE DEBUG ===");
    console.log("Active Tab:", activeTab);
    console.log("URL Params:", {
      page: searchParams.get("page"),
      claimed: searchParams.get("claimed"),
    });
    console.log("Loaded tokens count:", loadedTokens?.length || 0);
    console.log("Loaded tokens data:", loadedTokens);
    console.log("Pagination:", pagination);
    console.log("Error:", error);
    console.log("========================");
  }, [loadedTokens, pagination, error, activeTab, searchParams]);

  // Batch-fetch contract data for all tokens ONCE at page level
  // This eliminates redundant contract calls for price/supply data
  // Ensure loadedTokens is an array before mapping
  const tokenIds = useMemo(() => {
    if (!Array.isArray(loadedTokens)) return [];
    return loadedTokens.map((token) => token.fairLaunchId).filter(Boolean);
  }, [loadedTokens]);

  const { dataMap: contractDataMap } = useTokensBatchData(tokenIds);

  // Tokens are already filtered by backend based on 'claimed' query param
  // No need for client-side filtering anymore!
  // Ensure tokensToDisplay is always an array
  const tokensToDisplay = Array.isArray(loadedTokens) ? loadedTokens : [];

  // Adapt the loaded data to the format expected by the MemeTokenCard component
  const memeTokens = tokensToDisplay.map((token) => {
    // Debug each token's claimed status
    if (tokensToDisplay.length > 0 && tokensToDisplay.indexOf(token) === 0) {
      console.log("=== FIRST TOKEN DEBUG ===");
      console.log("Token:", token.metadata?.name);
      console.log("Token.claimed:", token.claimed);
      console.log("Active Tab:", activeTab);
      console.log(
        "Expected claimed value:",
        activeTab === "claimed" ? true : false
      );
      console.log("=======================");
    }

    return {
      id: token.id,
      name: token.metadata?.name || "Unnamed Token",
      creator: token.user?.address
        ? `${token.user.address.slice(0, 6)}...${token.user.address.slice(-4)}`
        : token.userId &&
          typeof token.userId === "string" &&
          token.userId.length >= 4
        ? `user...${token.userId.slice(-4)}`
        : "Unknown",
      ticker: token.metadata?.ticker || "UNKN",
      description: token.metadata?.description || "No description",
      price: 0,
      marketCap: "N/A",
      progress: 0,
      active: false,
      badge: token.claimed ? "Claimed" : "Unclaimed",
      badgeColor: token.claimed ? "bg-green-500" : "bg-yellow-500",
      image: token.metadata?.imageUrl || meme,
      fairLaunchId: token.fairLaunchId,
      address: token.address,
      createdAt: token.createdAt,
    };
  });

  // Fetch leaderboard data from backend (top 5 tokens by heat)
  // Only fetch when on "claimed" tab
  const { data: leaderboardData } = useTokensLeaderboard({
    page: 1,
    limit: 5,
    immediate: activeTab === "claimed",
  });

  // Transform leaderboard data to component format
  const leaderboard = useMemo(() => {
    if (!leaderboardData?.tokens || activeTab !== "claimed") {
      return [];
    }

    return leaderboardData.tokens.map((token, index) => ({
      id: token.id || index + 1,
      rank: index + 1,
      name: token.metadata?.name || "Unnamed Token",
      username: token.user?.socials?.[0]?.username
        ? `@${token.user.socials[0].username}`
        : token.user?.address
        ? `@${token.user.address.slice(0, 6)}...`
        : "@unknown",
      image: token.metadata?.imageUrl || meme,
      score: typeof token.heat === "bigint" ? Number(token.heat) : token.heat || 0,
      engagement:
        typeof token.heat === "bigint"
          ? Number(token.heat) >= 1000
            ? `${(Number(token.heat) / 1000).toFixed(1)}K`
            : String(Number(token.heat))
          : token.heat >= 1000
          ? `${(token.heat / 1000).toFixed(1)}K`
          : String(token.heat),
    }));
  }, [leaderboardData, activeTab]);

  // Calculate platform statistics
  // Use pagination.totalCount for accurate platform-wide total
  // Count active launches from contract data (status 0 = Active, 1 = Ongoing)
  const platformStats = useMemo(() => {
    // Count tokens with active fair launch status from contract data
    const activeLaunchCount = Object.values(contractDataMap).filter(
      (data) => data.status === 0 || data.status === 1
    ).length;
    
    return {
      totalTokens: pagination?.totalCount || 0, // Total tokens across all pages (platform-wide)
      activeLaunches: activeLaunchCount, // Number of truly active fair launches
    };
  }, [pagination?.totalCount, contractDataMap]);

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      const claimed = searchParams.get("claimed") || "true";
      setSearchParams({ page: String(pagination.currentPage + 1), claimed });
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPreviousPage) {
      const claimed = searchParams.get("claimed") || "true";
      setSearchParams({ page: String(pagination.currentPage - 1), claimed });
      window.scrollTo(0, 0);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-red-500 bg-gray-900 p-4 rounded-lg">
        <p className="text-lg">Error loading tokens: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        <Intro
          totalTokens={platformStats.totalTokens}
          activeLaunches={platformStats.activeLaunches}
        />

        {/* Tabs for switching between claimed and unclaimed tokens */}
        <div className="flex justify-between items-center border-b border-neutral-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("claimed")}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "claimed"
                  ? "border-green-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-300"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Claimed {claimedCount > 0 ? `(${claimedCount})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("unclaimed")}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "unclaimed"
                  ? "border-yellow-500 text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-300"
              }`}
            >
              <Unlock className="w-4 h-4" />
              Unclaimed {unclaimedCount > 0 ? `(${unclaimedCount})` : ""}
            </button>
          </div>

          {/* Refresh button to refetch latest tokens */}
          <button
            onClick={() => revalidator.revalidate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh token list"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Loading state - show while data is being fetched or URL/data mismatch */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
              <p className="text-neutral-400">Loading tokens...</p>
            </div>
          </div>
        )}

        {/* Show message if no tokens and not loading */}
        {!isLoading && memeTokens.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-lg mb-4">
              {activeTab === "claimed"
                ? "No claimed tokens yet. Check the Unclaimed tab!"
                : "No unclaimed tokens at the moment."}
            </p>
          </div>
        )}

        {/* Tokens display - hide while loading to prevent showing stale data */}
        {!isLoading && memeTokens.length > 0 && (
          <>
            {/* Trending tokens carousel - only for claimed tokens */}
            {activeTab === "claimed" && (
              <div className="overflow-x-auto w-full scrollbar-hide pb-4 mb-4">
                <div className="flex gap-4 w-full overflow-x-auto">
                  {memeTokens.slice(0, 7).map((token) => {
                    const contractData = token.fairLaunchId ? contractDataMap[token.fairLaunchId] : null;
                    const totalCommitted = contractData?.fairLaunchData?.[2] as bigint | undefined;
                    const raisedEthNum = totalCommitted ? Number(totalCommitted) / 1e18 : 0;
                    const raisedEth = raisedEthNum > 0 ? raisedEthNum.toFixed(2) : undefined;
                    const raisedUsd = (raisedEthNum > 0 && ethPriceData) 
                      ? (raisedEthNum * ethPriceData.priceNumber).toFixed(0)
                      : undefined;
                    return (
                      <HorizontalCard
                        key={token.id}
                        name={token.name}
                        creator={token.creator}
                        raised={raisedEth}
                        raisedUsd={raisedUsd}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tokens Grid with Leaderboard */}
            <div className="w-full">
              <MemeTokensList
                tokens={memeTokens}
                contractDataMap={contractDataMap}
              />

              {/* Leaderboard - only for claimed tokens with heat data */}
              {activeTab === "claimed" && leaderboard.length > 0 && (
                <Leaderboard items={leaderboard} />
              )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6">
                <button
                  onClick={handlePrevPage}
                  disabled={
                    !pagination.hasPreviousPage ||
                    revalidator.state === "loading"
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-neutral-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={
                    !pagination.hasNextPage || revalidator.state === "loading"
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
