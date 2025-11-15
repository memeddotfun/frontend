import { useState } from "react";
import { FlameIcon, Share2Icon } from "lucide-react";
import type { Token } from "@/hooks/api/useAuth"; // Re-added Token import
import meme from "@/assets/images/meme.png"; // Fallback placeholder image

interface MemeIntroCardProps {
  token: Token; // Reverted to Token type
}

const MemeIntroCard = ({ token }: MemeIntroCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Safely extract image URL with multiple fallback options to prevent undefined access errors
  // Priority: 1) token.image.s3Key, 2) token.metadata?.imageKey, 3) placeholder image
  const imageUrl = token.image?.s3Key || token.metadata?.imageKey || meme;

  // Safely extract token name and description from metadata with fallbacks
  const tokenName = token.metadata?.name || "Unnamed Token";
  const tokenDescription =
    token.metadata?.description || "No description provided.";

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

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400 mb-3">
            <span className="text-green-400 font-medium">
              {/* Display token contract address if deployed, otherwise fallback to user ID */}
              {token.address
                ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                : ``}
            </span>
            <span className="w-1 h-1 bg-neutral-600 rounded-full" />
            <span>
              {/* Safely access createdAt with fallback and error handling */}
              Created{" "}
              {token.createdAt
                ? new Date(token.createdAt).toLocaleDateString()
                : "Unknown date"}
            </span>
          </div>

          {/* Description - Display actual token description from metadata */}
          <p className="text-neutral-300 mb-4">{tokenDescription}</p>

          {/* Bottom Row */}
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <div className="flex items-center text-orange-400 font-semibold">
              <FlameIcon size={14} /> <span className="ml-1">0 Heat</span>
            </div>

            <button className="bg-green-500 hover:bg-green-600 text-black font-medium px-4 py-1.5 cursor-pointer rounded-md flex items-center gap-2 transition">
              <Share2Icon size={13} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeIntroCard;
