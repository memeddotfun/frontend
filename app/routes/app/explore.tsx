import { useLoaderData } from "react-router";
import { Intro } from "@/components/app/explore/Intro";
import { MemeTokensList } from "@/components/app/explore/MemeTokensList";
import { Leaderboard } from "@/components/app/explore/Leaderboard";
import meme from "@/assets/images/meme.png";
import { HorizontalCard } from "@/components/app/explore/HorizontalCard";
import { memeTokensLoader, type LoaderData } from "@/lib/api/loaders";
import type { Token } from "@/hooks/api/useAuth";

// Export the loader for this route, following the project convention
export { memeTokensLoader as loader };

export default function Explore() {
  // Use the data loaded by the loader
  const { data: loadedTokens, error } = useLoaderData() as LoaderData<Token[]>;

  // Adapt the loaded data to the format expected by the MemeTokenCard component
  const memeTokens = (loadedTokens || []).map((token) => ({
    id: token.id,
    name: token.metadata?.name || "Unnamed Token", // Real token name
    creator: `user...${token.userId?.slice(-4) || "Unknown"}`, // Real user ID (shortened) with safe access
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

  // TODO: This is mock data and should be replaced by a loader
  const leaderboard = [
    {
      id: 1,
      rank: 1,
      name: "Meme Name",
      username: "@memegod",
      image: meme,
      score: 42069,
      engagement: "9.4K",
    },
    {
      id: 2,
      rank: 2,
      name: "Meme Name",
      username: "@memegod",
      image: meme,
      score: 42069,
      engagement: "9.4K",
    },
    {
      id: 3,
      rank: 3,
      name: "Meme Name",
      username: "@memegod",
      image: meme,
      score: 42069,
      engagement: "9.4K",
    },
    {
      id: 4,
      rank: 4,
      name: "Meme Name",
      username: "@memegod",
      image: meme,
      score: 42069,
      engagement: "9.4K",
    },
    {
      id: 5,
      rank: 5,
      name: "Meme Name",
      username: "@memegod",
      image: meme,
      score: 42069,
      engagement: "9.4K",
    },
  ];

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
        <Intro />

        <div className="overflow-x-auto w-full scrollbar-hide pb-4 mb-4">
          <div className="flex gap-4  w-full overflow-x-auto">
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
            <HorizontalCard name="Glimp" creator="0Xbruh" price="$21k" />
          </div>
        </div>
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 xl:gap-8 w-full">
          {/* Meme Tokens Grid */}
          <div className="flex-1 min-w-0 ">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-4 xl:gap-2">
              {/* Meme Tokens List - always first */}
              <MemeTokensList tokens={memeTokens} />

              {/* Heat Score Leaderboard - always second, beside on xl screens */}
              <Leaderboard items={leaderboard} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
