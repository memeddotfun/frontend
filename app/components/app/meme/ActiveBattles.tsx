import { useState, useMemo } from "react";
import { SwordsIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BattleCard } from "@/components/shared/BattleCard";
import { useGetBattles, useGetBattleScore } from "@/hooks/contracts/useMemedBattle";
import { useTokenDetailsMap } from "@/hooks/useTokenDetailsMap";

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
  status: BattleStatus;
  winner: `0x${string}`;
  totalReward: bigint;
}

interface ActiveBattlesProps {
  tokenAddress: `0x${string}`;
}

/**
 * Component that fetches battle scores from contract and renders a BattleCard.
 * Separated to allow each battle to have its own score query hook.
 */
interface BattleCardWithScoreProps {
  battle: Battle;
  memeADetails: { name: string; image: string };
  memeBDetails: { name: string; image: string };
}

const BattleCardWithScore = ({ battle, memeADetails, memeBDetails }: BattleCardWithScoreProps) => {
  // Fetch battle scores from contract
  const { data: scoreData } = useGetBattleScore(battle.battleId);

  // scoreData is a tuple: [scoreA, scoreB, heatScoreA, heatScoreB, valueScoreA, valueScoreB]
  const scoreA = scoreData ? Number(scoreData[0]) : 0;
  const scoreB = scoreData ? Number(scoreData[1]) : 0;

  // Calculate percentages from contract scores
  const total = scoreA + scoreB;
  const percentageA = total > 0 ? (scoreA / total) * 100 : 50;
  const percentageB = 100 - percentageA;

  return (
    <BattleCard
      key={Number(battle.battleId)}
      leftImage={memeADetails.image}
      rightImage={memeBDetails.image}
      leftLabel={memeADetails.name}
      rightLabel={memeBDetails.name}
      leftViews={`${Number(battle.heatA).toLocaleString()} Heat`}
      rightViews={`${Number(battle.heatB).toLocaleString()} Heat`}
      leftPercentage={percentageA}
      rightPercentage={percentageB}
    />
  );
};

const ActiveBattles = ({ tokenAddress }: ActiveBattlesProps) => {
  // Pagination state - show 2 battles per page to match the grid
  const [currentPage, setCurrentPage] = useState(0);
  const battlesPerPage = 2;

  // Fetch all battles from contract
  const { data: battlesData, isLoading } = useGetBattles();
  const battles: Battle[] = (battlesData as Battle[]) || [];

  // Filter for active battles (STARTED status = 2) involving this token
  const activeBattles = useMemo(() => {
    return battles.filter(
      (battle) =>
        battle.status === 2 && // STARTED (Active)
        (battle.memeA.toLowerCase() === tokenAddress.toLowerCase() ||
          battle.memeB.toLowerCase() === tokenAddress.toLowerCase())
    );
  }, [battles, tokenAddress]);

  // Extract unique token addresses from active battles
  const tokenAddresses = useMemo(() => {
    const uniqueAddresses = new Set<string>();
    activeBattles.forEach((battle) => {
      uniqueAddresses.add(battle.memeA.toLowerCase());
      uniqueAddresses.add(battle.memeB.toLowerCase());
    });
    return Array.from(uniqueAddresses);
  }, [activeBattles]);

  // Fetch token details using shared hook (simple fields: name and image only)
  const { tokenDetailsMap } = useTokenDetailsMap(tokenAddresses);

  // Calculate pagination
  const totalPages = Math.ceil(activeBattles.length / battlesPerPage);
  const startIndex = currentPage * battlesPerPage;
  const endIndex = startIndex + battlesPerPage;
  const currentBattles = activeBattles.slice(startIndex, endIndex);

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Helper to determine which side is this token
  const getTokenSide = (battle: Battle): "left" | "right" => {
    return battle.memeA.toLowerCase() === tokenAddress.toLowerCase()
      ? "left"
      : "right";
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          <SwordsIcon />
          Active Battles
          {activeBattles.length > 0 && (
            <span className="text-sm text-neutral-400 font-normal">
              ({activeBattles.length})
            </span>
          )}
        </h2>

        {/* Pagination Controls - Only show if more than 2 battles */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-sm text-neutral-400">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : activeBattles.length === 0 ? (
        // Empty State
        <div className="text-center py-12 text-neutral-400">
          <SwordsIcon className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
          <p>No active battles at the moment</p>
        </div>
      ) : (
        // Battle Cards Grid
        <div className="grid lg:grid-cols-2 gap-6">
          {currentBattles.map((battle) => {
            // Get token details for display
            const memeADetails = tokenDetailsMap[battle.memeA.toLowerCase()] || {
              name: `${battle.memeA.slice(0, 6)}...`,
              image: "",
            };
            const memeBDetails = tokenDetailsMap[battle.memeB.toLowerCase()] || {
              name: `${battle.memeB.slice(0, 6)}...`,
              image: "",
            };

            // Use BattleCardWithScore component which fetches scores from contract
            return (
              <BattleCardWithScore
                key={Number(battle.battleId)}
                battle={battle}
                memeADetails={memeADetails}
                memeBDetails={memeBDetails}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveBattles;
