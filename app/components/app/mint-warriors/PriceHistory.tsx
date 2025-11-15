import { TrendingUp } from "lucide-react";
import { formatEther } from "viem";
import { useWarriorPriceHistory } from "@/hooks/contracts/useWarriorPriceHistory";

interface PriceHistoryProps {
  warriorNFTAddress: `0x${string}` | undefined;
  tokenName?: string;
}

/**
 * PriceHistory Component
 *
 * Displays real historical mint prices from blockchain WarriorMinted events.
 * Queries events, gets timestamps from blocks, and renders SVG chart.
 */
export default function PriceHistory({
  warriorNFTAddress,
  tokenName = "Token",
}: PriceHistoryProps) {
  // Fetch real price history from blockchain events
  const { priceHistory, isLoading, error } = useWarriorPriceHistory(warriorNFTAddress);

  if (isLoading) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TrendingUp className="text-blue-500" /> Price History
        </h2>
        <div className="text-neutral-400 text-center">Loading price history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TrendingUp className="text-blue-500" /> Price History
        </h2>
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-400 p-3 rounded-lg text-sm">
          ⚠️ Unable to load price history at the moment. You can still mint warriors.
        </div>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
          <TrendingUp className="text-blue-500" /> Price History
        </h2>
        <div className="text-neutral-400 text-center text-sm">
          No mints yet. Be the first to mint a {tokenName} Warrior!
        </div>
      </div>
    );
  }

  // Calculate min/max for chart scaling
  const prices = priceHistory.map((p) => Number(formatEther(p.price)));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 20;

  // Create SVG path from price points
  const points = priceHistory.map((point, index) => {
    const x = padding + (index / (priceHistory.length - 1 || 1)) * (width - 2 * padding);
    const price = Number(formatEther(point.price));
    const y = height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding);
    return { x, y, price, timestamp: point.timestamp };
  });

  const pathData = points
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Create area chart path (filled area under the line)
  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
      <h2 className="text-white text-lg font-semibold mb-4 flex gap-2 items-center">
        <TrendingUp className="text-green-500" /> Price History
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-green-400 text-xl font-semibold">
            {formatEther(priceHistory[priceHistory.length - 1].price)}
          </div>
          <div className="text-xs text-neutral-400">Current Price</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-blue-400 text-xl font-semibold">
            {minPrice.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-400">Floor</div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3 text-center">
          <div className="text-orange-400 text-xl font-semibold">
            {maxPrice.toFixed(2)}
          </div>
          <div className="text-xs text-neutral-400">Peak</div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="bg-neutral-800 rounded-lg p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definition for area fill */}
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#404040"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#404040"
            strokeWidth="1"
          />

          {/* Area fill under the line */}
          <path
            d={areaPathData}
            fill="url(#priceGradient)"
          />

          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#22c55e"
              stroke="#171717"
              strokeWidth="2"
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>
                {point.price.toFixed(4)} {tokenName} at{" "}
                {new Date(point.timestamp * 1000).toLocaleString()}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="text-xs text-neutral-400 text-center mt-2">
        Total Mints: {priceHistory.length}
      </div>
    </div>
  );
}
