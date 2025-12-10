import { useState } from "react";
import { FlameIcon, Share2Icon, Copy, Check, User } from "lucide-react";
import type { Token } from "@/hooks/api/useAuth"; // Re-added Token import
import meme from "@/assets/images/meme.png"; // Fallback placeholder image
import { useTokenHeat } from "@/hooks/contracts/useMemedFactory"; // Import contract heat hook
import { useShare } from "@/hooks/useShare"; // Import share hook for token sharing

interface MemeIntroCardProps {
  token: Token; // Reverted to Token type
}

const MemeIntroCard = ({ token }: MemeIntroCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Fetch real-time heat from smart contract (auto-refreshes every 30 seconds)
  const { data: contractHeat, isLoading: isLoadingHeat } = useTokenHeat(
    token.address as `0x${string}`
  );

  // Share hook for token sharing functionality
  const { share, isSharing } = useShare();

  // Safely extract image URL with multiple fallback options to prevent undefined access errors
  // Priority: 1) token.image.s3Key, 2) token.metadata?.imageKey, 3) placeholder image
  const imageUrl = token.image?.s3Key || token.metadata?.imageKey || meme;

  // Safely extract token name and description from metadata with fallbacks
  const tokenName = token.metadata?.name || "Unnamed Token";
  const tokenDescription =
    token.metadata?.description || "No description provided.";

  // Copy address to clipboard with visual feedback
  const handleCopyAddress = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Handle token sharing - Opens native share sheet on mobile or copies to clipboard on desktop
  const handleShare = () => {
    share({
      tokenName: tokenName,
      ticker: token.metadata?.ticker || "UNKNOWN",
      fairLaunchId: token.fairLaunchId?.toString(),
      tokenId: token.id?.toString(),
      imageUrl: imageUrl,
    });
  };

  return (
    <div className="bg-neutral-900 text-white p-4 rounded-xl  mx-auto">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        {/* Left: Token Image with fixed aspect ratio to prevent layout shift */}
        <div className="w-full md:w-1/6 relative">
          {/* Loading skeleton - shown while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-800 rounded-xl animate-pulse" />
          )}

          {/* Image with fixed aspect ratio and eager loading (above fold) */}
          <img
            src={imageUrl} // Use safely extracted image URL with fallbacks
            alt={tokenName} // Use token name for accessibility
            className="w-full aspect-square rounded-xl object-cover"
            loading="eager" // Load immediately (above fold content)
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 flex flex-col">
          {/* Title - Display actual token name from metadata */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-semibold">{tokenName}</h1>
          </div>

          {/* Meta Info - Token & Creator Addresses */}
          <div className="flex flex-col gap-2 text-sm mb-3">
            {/* Token Contract Address */}
            {token.address && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 min-w-[80px]">Token:</span>
                <code className="text-green-400 font-mono text-xs bg-neutral-800 px-2 py-1 rounded">
                  {token.address.slice(0, 10)}...{token.address.slice(-8)}
                </code>
                <button
                  onClick={() => handleCopyAddress(token.address!, "contract")}
                  className="p-1 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  title="Copy contract address"
                >
                  {copiedAddress === "contract" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            )}

            {/* Creator Address */}
            {token.userId && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 min-w-[80px] flex items-center gap-1">
                  {/*<User className="w-3 h-3" />*/}
                  Creator:
                </span>
                <code className="text-neutral-400 font-mono text-xs bg-neutral-800 px-2 py-1 rounded">
                  {token.userId.slice(0, 10)}...{token.userId.slice(-8)}
                </code>
                <button
                  onClick={() => handleCopyAddress(token.userId!, "creator")}
                  className="p-1 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  title="Copy creator address"
                >
                  {copiedAddress === "creator" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            )}

            {/* Creation Date */}
            <div className="flex items-center gap-2 text-neutral-500">
              <span className="min-w-[80px]">Created:</span>
              <span>
                {token.createdAt
                  ? new Date(token.createdAt).toLocaleDateString()
                  : "Unknown date"}
              </span>
            </div>
          </div>

          {/* Description - Display actual token description from metadata */}
          <p className="text-neutral-300 mb-4">{tokenDescription}</p>

          {/* Bottom Row */}
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <div className="flex items-center text-orange-400 font-semibold">
              <FlameIcon size={14} />{" "}
              <span className="ml-1">
                {isLoadingHeat
                  ? '...'
                  : (contractHeat ? Number(contractHeat).toLocaleString() : '0')} Heat
              </span>
            </div>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-green-500 hover:bg-green-600 text-black font-medium px-4 py-1.5 cursor-pointer rounded-md flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2Icon size={13} />
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeIntroCard;
