import { MemeTokenCard } from "./MemeTokenCard";

interface MemeToken {
  id: string;
  name: string;
  creator: string;
  price: number;
  marketCap: string;
  progress: number;
  active?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface MemeTokensListProps {
  tokens: MemeToken[];
}

export function MemeTokensList({ tokens }: MemeTokensListProps) {
  return (
    <div className="col-span-1 xl:col-span-3 bg-neutral-900 border p-2 sm:p-4 xl:p-2 border-neutral-800 rounded-xl min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-4 bg-dark-900 rounded-md p-1.5 sm:p-2">
          <span className="text-gray-400 text-xs sm:text-sm">Sort By:</span>
          <select className="bg-neutral-900 text-white px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm rounded-lg border cursor-pointer border-neutral-800 focus:outline-none focus:border-green-500">
            <option>New</option>
            <option>Popular</option>
            <option>Market Cap</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <MemeTokenCard key={token.id} token={token} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-1 sm:gap-2 mt-auto pt-4">
        <button className="p-1.5 sm:p-2 rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded bg-neutral-800 cursor-pointer">
          1
        </button>
        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          2
        </button>
        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          3
        </button>
        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          4
        </button>
        <span className="px-1 sm:px-2 text-xs sm:text-sm">...</span>
        <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          100
        </button>
        <button className="p-1.5 sm:p-2 rounded hover:bg-neutral-800 transition-colors cursor-pointer">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
