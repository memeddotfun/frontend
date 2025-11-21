import { TrophyIcon } from "lucide-react";
import { LeaderboardCard } from "./LeaderboardCard";

interface LeaderboardItem {
  id: string | number; // Allow both string and number to handle different token ID types
  rank: number;
  name: string;
  username: string;
  image: string;
  score: number;
  engagement: string;
}

interface LeaderboardProps {
  items: LeaderboardItem[];
}

export function Leaderboard({ items }: LeaderboardProps) {
  return (
    <div className="col-span-1">
      <div className="bg-neutral-900 rounded-xl p-4 sm:p-5 md:p-6 border border-neutral-800 h-full">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
          <span className="text-lg sm:text-xl md:text-2xl">
            <TrophyIcon className="w-4 h-4 sm:w-5 md:w-6" />
          </span>
          Leaderboard
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <LeaderboardCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
