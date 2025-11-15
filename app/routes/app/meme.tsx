import MemeIntroCard from "@/components/app/meme/MemeCard";
import SocialMediaStats from "@/components/app/meme/SocialMediaStats";
import LaunchProgress from "@/components/app/meme/LaunchProgress";
import CommitETHForm from "@/components/app/meme/CommitETHForm";
import ReadyToLaunch from "@/components/app/meme/ReadyToLaunch";
import LoadingState from "@/components/app/meme/LoadingState";
import ClaimTokenPanel from "@/components/app/meme/ClaimTokenPanel";
import RefundPanel from "@/components/app/meme/RefundPanel";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
// import TradeForm from "@/components/app/meme/TradeForm"; // Commented out - not needed per team lead
import {
  useFairLaunchData,
  useIsRefundable,
} from "@/hooks/contracts/useMemedTokenSale";
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
  console.log(token);
  // Phase states: 1 = commitment, 2 = ready to launch, 3 = launched, 4 = failed
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4>(1);

  // Helper function to convert token ID to contract ID with error handling
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
      // Silently handle conversion errors and return 0
      return 0n;
    }
  };

  // Use the proper contract ID conversion function
  const contractTokenId = token ? getContractTokenId(token) : 0n;

  // Monitor fair launch status for real-time phase changes
  const { data: fairLaunchData, isLoading: isFairLaunchLoading } =
    useFairLaunchData(contractTokenId);

  // Check if launch is refundable (failed) - important for accurate phase detection
  const { data: isRefundable } = useIsRefundable(contractTokenId);

  // Real-time phase monitoring - checks both status AND isRefundable for accurate phase detection
  useEffect(() => {
    if (fairLaunchData) {
      const status = fairLaunchData[0]; // status is at index 0
      console.log("fair launch data", fairLaunchData, contractTokenId);

      // PRIORITY: Check if refundable (failed launch)
      // This covers both explicit status 4 AND other failure conditions (time expired, etc.)
      console.log("isRefundable", isRefundable);
      if (isRefundable === true || status === 4) {
        setCurrentPhase(4); // Failed launch - show RefundPanel
        setActive(false);
      } else if (status === 1) {
        setCurrentPhase(1); // Commitment phase
        setActive(false);
      } else if (status === 2) {
        setCurrentPhase(2); // Ready to launch phase
        setActive(false);
      } else if (status === 3) {
        setCurrentPhase(3); // Launched phase - show ClaimPanel
        setActive(true);
      }
    }
  }, [fairLaunchData, isRefundable, currentPhase]);

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

  // Show loading skeleton while fair launch data is being fetched
  // Prevents flash of wrong phase components before data arrives
  if (isFairLaunchLoading && !fairLaunchData) {
    return (
      <div className="min-h-screen w-full">
        <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-500 cursor-pointer"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <LoadingState />
        </div>
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
                Mint {token.metadata?.name || "Token"} Warriors
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
            {currentPhase === 4 && (
              <div className="bg-red-500/20 border border-red-600 text-red-300 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">❌ Launch Failed</h3>
                <p className="text-sm">
                  The {token.metadata?.name || "token"} launch did not reach its
                  funding goal. All participants can claim a full refund of
                  their committed funds.
                </p>
              </div>
            )}
          </div>
          {/* Right Section: Phase-based panels */}
          {currentPhase === 1 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <CommitETHForm
                tokenId={contractTokenId}
                onCommitSuccess={handleCommitSuccess}
              />
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
            </div>
          )}
          {/* TradeForm commented out per team lead - not needed */}
          {/* {currentPhase === 3 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <TradeForm tokenAddress={token?.address} />
            </div>
          )} */}
          {/* ClaimTokenPanel for successful launch (status 3) */}
          {currentPhase === 3 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <ClaimTokenPanel
                tokenId={contractTokenId}
                tokenName={token.metadata?.name}
              />
            </div>
          )}
          {/* RefundPanel for failed launch (status 4) */}
          {currentPhase === 4 && (
            <div className="w-full xl:w-[400px] flex flex-col space-y-4 sm:space-y-6">
              <RefundPanel
                tokenId={contractTokenId}
                tokenName={token.metadata?.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
