import { Flame } from "lucide-react";
import { Link } from "react-router";

interface MemeCardProps {
  address?: string; // Token address for navigation
  title: string;
  creator: string;
  image: string;
  marketCap: string;
  heat?: number; // Heat/flame count
  change24h?: number;
  isActive?: boolean;
}

// Helper to format large numbers
const formatCount = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

export function MemeCard({
  address,
  title,
  creator,
  image,
  marketCap,
  heat = 0,
  change24h = 0,
  isActive = true,
}: MemeCardProps) {
  const isPositive = change24h >= 0;

  const CardContent = () => (
    <div className="rounded-xl bg-neutral-900 overflow-hidden transition-all hover:transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 duration-300">
      <div className="aspect-square relative overflow-hidden  p-3">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>

      <div className="p-3 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          {isActive && (
            <div className="pt-2 text-center">
              <span className="inline-block bg-green-500/10 text-green-500 text-xs font-medium px-3 py-1 rounded-full">
                Active
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-gray-300 text-xs">
            Created by: <span className="text-white">{creator}</span>
          </div>

          <div className="text-gray-300 flex items-center gap-3 text-xs">
            <div className="flex items-center ">
              <Flame size={15} className="text-orange-500" />{" "}
              <span className="text-white">{formatCount(heat)}</span>
            </div>
            <div className="flex items-center gap-2 ">
              <span className="text-green-500">Market cap:</span>{" "}
              <span className="text-white">{marketCap}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap in Link if address is provided, otherwise render as plain div
  if (address) {
    return (
      <Link to={`/app/meme/${address}`} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
