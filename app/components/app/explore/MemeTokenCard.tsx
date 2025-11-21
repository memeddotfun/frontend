import { useState } from "react";
import { Flame, Timer, Rocket, XCircle, Unlock } from "lucide-react";
import { Link } from "react-router";
import {
  useFairLaunchData,
  useIsRefundable,
} from "@/hooks/contracts/useMemedTokenSale";

interface MemeTokenCardProps {
  token: {
    id: string;
    name: string;
    creator: string;
    price: number;
    marketCap: string;
    progress: number;
    image: string; // Added image prop
    fairLaunchId?: string; // Fair launch ID for fetching contract status
    active?: boolean;
    badge?: string;
    badgeColor?: string;
  };
  linkTo?: string; // Optional custom link destination
  isUnclaimed?: boolean; // Whether this token is unclaimed
}

export function MemeTokenCard({ token, linkTo, isUnclaimed = false }: MemeTokenCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert fairLaunchId to BigInt for contract calls
  const contractTokenId = token.fairLaunchId ? BigInt(token.fairLaunchId) : 0n;

  // Get fair launch status from contract
  const { data: fairLaunchData } = useFairLaunchData(contractTokenId);
  const { data: isRefundable } = useIsRefundable(contractTokenId);

  // Determine current phase based on contract data
  // FairLaunchStatus enum: 0 = NOT_STARTED, 1 = ACTIVE, 2 = COMPLETED, 3 = FAILED
  const status = fairLaunchData ? fairLaunchData[0] : 0;
  const isFailed = isRefundable === true || status === 3;

  // Use custom link if provided, otherwise default to token detail page
  const destination = linkTo || `/explore/meme/${token.id}`;

  return (
    <Link
      to={destination}
      className={`bg-neutral-900 rounded-xl p-2 sm:p-3 hover:bg-neutral-800 transition-colors cursor-pointer border ${
        isUnclaimed ? 'border-yellow-500/50' : 'border-neutral-800'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Token Image with lazy loading and loading skeleton */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative flex-shrink-0">
          {/* Loading skeleton - shown while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-800 rounded-lg animate-pulse" />
          )}

          {/* Image with fixed aspect ratio and lazy loading */}
          <img
            src={token.image} // Use the image from the token prop
            alt={token.name}
            className="w-full h-full rounded-lg object-cover"
            loading="lazy" // Lazy load images below fold
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <div className="flex-1 overflow-hidden">
              <h3
                className="font-semibold text-white text-sm sm:text-base truncate"
                title={token.name}
              >
                {token.name}
              </h3>
              <p
                className="text-xs text-gray-400 truncate"
                title={`Created by ${token.creator}`}
              >
                Created by <span className="text-white">{token.creator}</span>
              </p>
            </div>
            {/* Status Badge - Shows actual launch phase from contract or Unclaimed */}
            {isUnclaimed ? (
              <span className="text-black bg-yellow-500 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0 flex gap-1 items-center">
                <Unlock size={12} /> Unclaimed
              </span>
            ) : isFailed ? (
              <span className="text-red-500 bg-red-800/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0 flex gap-1 items-center">
                <XCircle size={12} /> Failed
              </span>
            ) : status === 2 ? (
              <span className="text-green-500 bg-green-900/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0 flex gap-1 items-center">
                <Rocket size={12} /> Launched
              </span>
            ) : status === 1 ? (
              <span className="text-yellow-500 bg-yellow-800/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0 flex gap-1 items-center">
                <Timer size={12} /> Funding
              </span>
            ) : (
              <span className="text-gray-500 bg-gray-800/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0">
                N/A
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1 sm:mb-2">
            <span className="text-orange-500 font-medium flex items-center gap-1">
              <Flame size={12} />{" "}
              <span className="text-white">{token.price}M</span>
            </span>
            <span
              className="text-gray-400 text-[10px] sm:text-xs truncate"
              title={`Market Cap: ${token.marketCap} ETH`}
            >
              {token.active ? (
                "13k ETH /"
              ) : (
                <span className="text-primary-500 font-semibold pr-1 sm:pr-2">
                  Mkt Cap:
                </span>
              )}
              <span className="text-white">{token.marketCap} ETH</span>
            </span>
          </div>

          {token.active && (
            <div className="w-full bg-neutral-700 rounded-full h-1 sm:h-1.5 mb-1 sm:mb-2">
              <div
                className="bg-green-500 h-1 sm:h-1.5 rounded-full transition-all"
                style={{ width: `${token.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
