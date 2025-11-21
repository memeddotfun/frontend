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
import { useGetTokenData } from "@/hooks/contracts/useMemedFactory";
import { Unlock, ArrowLeft } from "lucide-react";

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

  // Check if token is unclaimed using contract data
  const { data: tokenClaimData, isLoading: isClaimDataLoading } = useGetTokenData(
    token?.fairLaunchId ? BigInt(token.fairLaunchId) : BigInt(0)
  );

  // tokenData structure: [token, warriorNFT, creator, name, ticker, description, image, isClaimedByCreator]
  // isClaimedByCreator is at index 7
  const isTokenUnclaimed = tokenClaimData && token?.fairLaunchId
    ? !(tokenClaimData as any)[7]
    : false;

  // Debug logging for claim status
  console.log('[Meme Detail] Claim Status Check:', {
    tokenId: token?.id,
    fairLaunchId: token?.fairLaunchId,
    hasClaimData: !!tokenClaimData,
    isClaimDataLoading,
    isClaimedByCreator: tokenClaimData ? (tokenClaimData as any)[7] : 'no data',
    isTokenUnclaimed,
  });

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
      const fairLaunchStartTime = fairLaunchData[1];
      const totalCommitted = fairLaunchData[2];
      const totalSold = fairLaunchData[3];
      const uniswapPair = fairLaunchData[4];
      const createdAt = fairLaunchData[5];

      console.log("=== FAIR LAUNCH DEBUG ===");
      console.log("Contract Token ID:", contractTokenId.toString());
      console.log("Status (0=NOT_STARTED, 1=ACTIVE, 2=COMPLETED, 3=FAILED):", status);
      console.log("Fair Launch Start Time:", new Date(Number(fairLaunchStartTime) * 1000).toLocaleString());
      console.log("Total Committed (wei):", totalCommitted.toString());
      console.log("Total Sold (wei):", totalSold.toString());
      console.log("Uniswap Pair Address:", uniswapPair);
      console.log("Created At:", new Date(Number(createdAt) * 1000).toLocaleString());
      console.log("Is Refundable:", isRefundable);
      console.log("Current Phase:", currentPhase);
      console.log("========================");

      // CORRECT STATUS MAPPING based on FairLaunchStatus enum:
      // 0 = NOT_STARTED, 1 = ACTIVE, 2 = COMPLETED, 3 = FAILED

      // PRIORITY: Check if failed (status 3) or refundable
      if (isRefundable === true || status === 3) {
        console.log("→ Setting phase to 4 (FAILED - Refundable)");
        setCurrentPhase(4); // Failed launch - show RefundPanel
        setActive(false);
      } else if (status === 1) {
        console.log("→ Setting phase to 1 (ACTIVE - Commitment Phase)");
        setCurrentPhase(1); // Active - commitment phase
        setActive(false);
      } else if (status === 2) {
        console.log("→ Setting phase to 3 (COMPLETED - Tokens Claimable!)");
        console.log("   Status 2 = COMPLETED means fair launch succeeded and tokens are claimable.");
        setCurrentPhase(3); // COMPLETED - show ClaimPanel (tokens claimable)
        setActive(true);
      } else if (status === 0) {
        console.log("→ Status 0 (NOT_STARTED) - defaulting to phase 1");
        setCurrentPhase(1);
        setActive(false);
      } else {
        console.log("→ Unknown status:", status, "- defaulting to phase 1");
        setCurrentPhase(1);
        setActive(false);
      }
    } else {
      console.log("No fairLaunchData available yet");
    }
  }, [fairLaunchData, isRefundable, contractTokenId, currentPhase]);

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

  // If token is unclaimed, show special claim UI instead of normal token details
  if (isTokenUnclaimed && token) {
    return (
      <div className="min-h-screen w-full">
        <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 w-full max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back to Explore
          </button>

          {/* Unclaimed Token Card */}
          <div className="bg-neutral-900 border border-yellow-500/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-6 border-b border-yellow-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Unlock className="w-8 h-8 text-yellow-500" />
                <h1 className="text-3xl font-bold text-white">Unclaimed Token</h1>
              </div>
              <p className="text-neutral-300">This token hasn't been claimed by its creator yet</p>
            </div>

            {/* Token Info */}
            <div className="p-6 space-y-6">
              {/* Token Image and Details */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                    {token.metadata?.imageKey || token.image?.s3Key ? (
                      <img
                        src={token.metadata?.imageKey || token.image?.s3Key}
                        alt={token.metadata?.name || "Token"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🎭
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {token.metadata?.name || "Unnamed Token"}
                    </h2>
                    <p className="text-lg text-yellow-500 font-semibold">
                      ${token.metadata?.ticker || "???"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-400 mb-2">Description</h3>
                    <p className="text-neutral-300">
                      {token.metadata?.description || "No description available"}
                    </p>
                  </div>

                  {token.user?.socials && token.user.socials.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-400 mb-2">Creator</h3>
                      {token.user.socials.map((social: any) => (
                        <div key={social.id} className="flex items-center gap-2">
                          <span className="text-neutral-300">
                            {social.type}: @{social.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">ℹ️ About Unclaimed Tokens</h3>
                <p className="text-sm text-neutral-300">
                  This token was created for a Lens creator who hasn't claimed ownership yet.
                  Only the rightful creator (wallet owner of the associated Lens handle) can claim this token.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/claim-token/${token.id}`}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-5 h-5" />
                  Claim This Token
                </Link>
                <button
                  onClick={handleBack}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
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
                <ActiveBattles tokenAddress={token.address as `0x${string}`} />
                <BattleHistory tokenAddress={token.address as `0x${string}`} />
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
