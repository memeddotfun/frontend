import { Flame, Timer } from "lucide-react";
import { Link } from "react-router";

interface MemeTokenCardProps {
  token: {
    id: string;
    name: string;
    creator: string;
    price: number;
    marketCap: string;
    progress: number;
    image: string; // Added image prop
    active?: boolean;
    badge?: string;
    badgeColor?: string;
  };
}

export function MemeTokenCard({ token }: MemeTokenCardProps) {
  return (
    <Link
      to={`/explore/meme/${token.id}`}
      className="bg-neutral-900 rounded-xl p-2 sm:p-3 hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-800"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src={token.image} // Use the image from the token prop
          alt={token.name}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
        />
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
            {token.active ? (
              <span className="text-primary-500 bg-primary-900/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0">
                Active
              </span>
            ) : (
              <span className="text-yellow-500 bg-yellow-800/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ml-2 flex-shrink-0 flex gap-1 sm:gap-2 flex-nowrap items-center">
                <Timer size={12} /> Pending
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
              title={`Market Cap: ${token.marketCap} Gho`}
            >
              {token.active ? (
                "13k Gho /"
              ) : (
                <span className="text-primary-500 font-semibold pr-1 sm:pr-2">
                  Mkt Cap:
                </span>
              )}
              <span className="text-white">{token.marketCap} Gho</span>
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
