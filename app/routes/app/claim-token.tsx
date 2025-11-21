import { useState, useEffect } from "react";
import { useParams, useNavigate, useLoaderData } from "react-router";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "sonner";
import {
  Unlock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS, buildEndpoint } from "@/lib/api/config";
import { useGetTokenData } from "@/hooks/contracts/useMemedFactory";
import { useCreateNonce, type Token } from "@/hooks/api/useAuth";
import { memeTokenDetailLoader, type LoaderData } from "@/lib/api/loaders";

// Export the loader for this route
export { memeTokenDetailLoader as loader };

export default function ClaimToken() {
  const { memeId } = useParams<{ memeId: string }>();
  const { data: token, error: loaderError } =
    useLoaderData() as LoaderData<Token>;
  const navigate = useNavigate();
  const { address } = useAccount();
  const { user } = useAuthStore();
  const { signMessageAsync } = useSignMessage();
  const { mutate: createNonce } = useCreateNonce();

  // Claim status state
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Get claim status from contract using token from loader
  const { data: contractTokenData, isLoading: isLoadingContract } =
    useGetTokenData(
      token?.fairLaunchId ? BigInt(token.fairLaunchId) : BigInt(0)
    );

  console.log(
    "[Claim Token] Contract Data:",
    contractTokenData,
    "Token:",
    token
  );

  // Check if token is unclaimed
  // contractTokenData structure: [token, warriorNFT, creator, isClaimedByCreator]
  // isClaimedByCreator is at index 3, creator is at index 2
  const isUnclaimed = contractTokenData
    ? !(contractTokenData as any)[3]
    : false;
  const creatorAddress = contractTokenData
    ? (contractTokenData as any)[2]
    : null;

  // Check launch status - if launch failed, disable claiming
  // Backend returns 'failed' boolean field, not 'phase'
  const isLaunchFailed = token?.failed === true;
  const launchStatus = isLaunchFailed ? "FAILED" :
                       token?.claimed ? "COMPLETED" :
                       "IN_PROGRESS";
  const canClaim = isUnclaimed && !isLaunchFailed;

  // Handle claim submission
  const handleClaim = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!memeId) {
      toast.error("Invalid token ID");
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      // Step 1: Request nonce

      const nonceResponse = await createNonce({ address });
      if (!nonceResponse?.nonce) {
        throw new Error("Failed to retrieve nonce for signing.");
      }
      const nonce = nonceResponse.nonce;

      // Step 2: Sign the nonce
      const signature = await signMessageAsync({ message: nonce });

      // Step 3: Submit claim request
      const response = await apiClient.post(
        API_ENDPOINTS.CLAIM_UNCLAIMED_TOKEN,
        { id: memeId },
        {
          headers: {
            Nonce: JSON.stringify({
              message: nonce,
              signature,
            }),
          },
        }
      );

      // Success
      toast.success("Token claimed successfully!");
      setClaimSuccess(true);

      // Redirect to token detail page after short delay
      setTimeout(() => {
        navigate(`/explore/meme/${memeId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to claim token:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to claim token";
      setClaimError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (isLoadingContract) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-neutral-400">Loading token details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loaderError || !token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-6 rounded-lg max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-sm">
            {loaderError || "Failed to load token details"}
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  // Already claimed state
  if (!isUnclaimed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-blue-500/10 border border-blue-500 text-blue-400 p-6 rounded-lg max-w-md text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Token Already Claimed</h2>
          <p className="text-sm mb-4">
            This token has already been claimed by its owner.
          </p>
          <button
            onClick={() => navigate(`/explore/meme/${memeId}`)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            View Token Details
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (claimSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-8 rounded-lg max-w-md text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Token Claimed Successfully!
          </h2>
          <p className="text-sm mb-4">
            You are now the owner of {token.metadata?.name}. Redirecting to
            token details...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-t from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center">
            <Unlock className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Claim Token</h1>
            <p className="text-gray-400 mt-1">
              Claim ownership of this unclaimed token
            </p>
          </div>
        </div>

        {/* Token Display */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left: Token Image */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            <div className="aspect-square w-full bg-neutral-800 rounded-lg overflow-hidden mb-4">
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
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <Unlock className="w-4 h-4 flex-shrink-0" />
              <span>This token is currently unclaimed</span>
            </div>
          </div>

          {/* Right: Token Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {token.metadata?.name || "Unnamed Token"}
              </h2>
              <p className="text-xl text-neutral-400 mb-4">
                ${token.metadata?.ticker || "???"}
              </p>
              <p className="text-neutral-300">
                {token.metadata?.description || "No description available"}
              </p>
            </div>

            {/* Creator Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">
                Token Information
              </h3>
              <div className="space-y-2 text-sm">
                {token.user?.socials?.[0] && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{token.user.socials[0].type} Handle:</span>
                    <span className="text-white font-mono">
                      @{token.user.socials[0].username}
                    </span>
                  </div>
                )}
                {creatorAddress && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Creator Address:</span>
                    <span className="text-white font-mono text-xs">
                      {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">Claim Status:</span>
                  <span className="text-yellow-400 font-semibold">
                    Unclaimed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Launch Status:</span>
                  <span className={`font-semibold ${
                    launchStatus === "COMPLETED" ? "text-green-400" :
                    isLaunchFailed ? "text-red-400" :
                    "text-yellow-400"
                  }`}>
                    {launchStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            How to Claim This Token
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Verify Your Identity
                </h4>
                <p className="text-neutral-400 text-sm">
                  You must be the owner of the {token.user?.socials?.[0]?.type || "social"} handle{" "}
                  {token.user?.socials?.[0] ? (
                    <span className="text-white font-mono">
                      @{token.user.socials[0].username}
                    </span>
                  ) : (
                    "associated with this token"
                  )}{" "}
                  to claim it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Sign with Your Wallet
                </h4>
                <p className="text-neutral-400 text-sm">
                  Click the claim button below and sign the message with your
                  wallet. We'll verify you own the Lens handle.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Take Ownership
                </h4>
                <p className="text-neutral-400 text-sm">
                  Once verified, the token ownership will be transferred to you
                  on-chain. You'll have full control over the token.
                </p>
              </div>
            </div>
          </div>

          {/* Failed Launch Warning */}
          {isLaunchFailed && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-1">Launch Failed</p>
                  <p className="text-xs">
                    This token's launch has failed or been cancelled. It cannot be claimed at this time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {claimError && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{claimError}</p>
              </div>
            </div>
          )}

          {/* Claim Button */}
          {!address ? (
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-4 rounded-lg">
              <p className="text-sm">
                Please connect your wallet to claim this token
              </p>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming || isLaunchFailed}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Claiming Token...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Claim {token.metadata?.name} Token
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          {/* Info Notice */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">ℹ️ Important</h4>
            <ul className="space-y-1 text-xs">
              <li>
                • Only the wallet that owns the Lens handle can successfully
                claim this token
              </li>
              <li>
                • Claiming is a one-time action and transfers ownership to you
              </li>
              <li>
                • After claiming, you'll be redirected to the token detail page
              </li>
              <li>
                • The transaction requires your signature for verification
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
