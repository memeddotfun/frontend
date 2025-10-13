import MemeIntroCard from "@/components/app/meme/MemeCard";
import SocialMediaStats from "@/components/app/meme/SocialMediaStats";
import LaunchProgress from "@/components/app/meme/LaunchProgress";
import CommitGHOForm from "@/components/app/meme/CommitGHOForm";
import CountdownTimer from "@/components/app/meme/CountdownTimer";
import { useState } from "react";
import { useNavigate } from "react-router";
import TradeForm from "@/components/app/meme/TradeForm";
import BattleHistory from "@/components/app/meme/BattleHistory";
import ActiveBattles from "@/components/app/meme/ActiveBattles";
import { ChevronLeft, Sword } from "lucide-react";
import { useParams, Link, useLoaderData } from "react-router";
import { memeTokenDetailLoader, type LoaderData } from "@/lib/api/loaders";
import type { Token } from "@/hooks/api/useAuth";

// Export the loader for this route
export { memeTokenDetailLoader as loader };

export default function Meme() {
  const { data: token, error } = useLoaderData() as LoaderData<Token>;
  const navigate = useNavigate();
  const { memeId } = useParams();
  const [active, setActive] = useState<boolean>(true);
  console.log(token);
  const handleBack = () => navigate(-1);
  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
        <p className="text-red-500 text-lg mb-4">Error: {error}</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white cursor-pointer"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
        <p className="text-lg mb-4">Token not found.</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white cursor-pointer"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-neutral-500 cursor-pointer "
        >
          <ChevronLeft size={14} />
          Back
        </button>
        {/* Top Hero Card */}
        <MemeIntroCard token={token} />

        {/* Social + Launch + Commit Layout */}
        <div className="flex flex-col xl:flex-row gap-4 md:gap-6 xl:gap-8 w-full">
          {/* Left Section: Social Stats + Launch Progress */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            <SocialMediaStats />

            {/* Mint Warriors Button */}
            <Link
              to={`/explore/meme/${memeId}/mint`}
              className="bg-green-500 hover:bg-green-700 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sword className="w-5 h-5" />
              Mint Pepe's Revenge Warriors
            </Link>
            {!active ? (
              <LaunchProgress />
            ) : (
              <>
                <ActiveBattles />
                <BattleHistory />
              </>
            )}
          </div>
          {/* Right Section: Commit + Timer */}
          {!active && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <CommitGHOForm />
              <CountdownTimer />
            </div>
          )}
          {active && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <TradeForm />
              {/*<StakeForm />*/}
              {/*<UnstakeForm />*/}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
