import MemeIntroCard from "@/components/app/meme/MemeCard";
import SocialMediaStats from "@/components/app/meme/SocialMediaStats";
import LaunchProgress from "@/components/app/meme/LaunchProgress";
import CommitETHForm from "@/components/app/meme/CommitETHForm";
import CountdownTimer from "@/components/app/meme/CountdownTimer";
import ReadyToLaunch from "@/components/app/meme/ReadyToLaunch";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import TradeForm from "@/components/app/meme/TradeForm";
import { useFairLaunchData } from "@/hooks/contracts/useMemedTokenSale";
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
  const [active, setActive] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<string>(Date.now().toString());

  // Phase states: 1 = commitment, 2 = ready to launch, 3 = launched
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);

  console.log(token);
  // Helper function to convert token ID to contract ID
  const getContractTokenId = (token: Token) => {
    try {
      if (token.fairLaunchId !== undefined && token.fairLaunchId !== null) {
        return BigInt(token.fairLaunchId);
      }

      if (token.id !== undefined && token.id !== null) {
        return BigInt(token.id);
      }

      return 0n;
    } catch (error) {
      console.error("Error converting ID to BigInt:", error);
      return 0n;
    }
  };

  // Use the proper contract ID conversion function
  const contractTokenId = token ? getContractTokenId(token) : 0n;

  // Monitor fair launch status for real-time phase changes
  const { data: fairLaunchData } = useFairLaunchData(contractTokenId);

  // Real-time phase monitoring
  useEffect(() => {
    if (fairLaunchData) {
      const status = fairLaunchData[0]; // status is at index 0

      console.log("=== PHASE MONITORING ===");
      console.log("Current contract status:", status);
      console.log("Current UI phase:", currentPhase);

      if (status === 1) {
        setCurrentPhase(1); // Commitment phase
        setActive(false);
      } else if (status === 2) {
        setCurrentPhase(2); // Ready to launch phase
        setActive(false);
      } else if (status === 3) {
        setCurrentPhase(3); // Launched phase
        setActive(true);
      }

      console.log("Updated UI phase to:", status);
      console.log("=== END PHASE MONITORING ===");
    }
  }, [fairLaunchData, currentPhase]);

  // Callback to refresh launch progress when commit succeeds
  const handleCommitSuccess = useCallback(() => {
    setRefreshKey(Date.now().toString());
  }, []);

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

            {/* Mint Warriors Button - Only visible in launched phase (status 3) */}
            {currentPhase === 3 && (
              <Link
                to={`/explore/meme/${memeId}/mint`}
                className="bg-green-500 hover:bg-green-700 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sword className="w-5 h-5" />
                Mint Pepe's Revenge Warriors
              </Link>
            )}
            {/* Phase-based rendering */}
            {currentPhase === 1 && (
              <LaunchProgress tokenId={contractTokenId} key={refreshKey} />
            )}
            {currentPhase === 2 && (
              <ReadyToLaunch
                tokenId={contractTokenId}
                fairLaunchData={fairLaunchData}
              />
            )}
            {currentPhase === 3 && (
              <>
                <ActiveBattles />
                <BattleHistory />
              </>
            )}
          </div>
          {/* Right Section: Phase-based panels */}
          {currentPhase === 1 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <CommitETHForm
                tokenId={contractTokenId}
                onCommitSuccess={handleCommitSuccess}
              />
              <CountdownTimer />
            </div>
          )}
          {currentPhase === 2 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              {/* No forms available in ready-to-launch phase */}
              <div className="bg-neutral-900 p-6 rounded-xl">
                <h3 className="text-white text-lg font-semibold mb-4">
                  🔒 Launch Preparation
                </h3>
                <div className="text-neutral-400 text-sm space-y-2">
                  <p>All systems ready for launch!</p>
                  <p>
                    Trading will be available once the project officially
                    launches.
                  </p>
                </div>
              </div>
              <CountdownTimer />
            </div>
          )}
          {currentPhase === 3 && (
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
