import meme from "@/assets/images/meme.png";
import { Link } from "react-router";
import { Rocket, ChevronRight, TrendingUp } from "lucide-react";

// Props interface for real data
interface IntroProps {
  totalTokens?: number;
  activeLaunches?: number;
}

/**
 * Intro Component
 *
 * Displays the hero section of the Explorer page with:
 * - Call to action to create new tokens
 * - Real-time stats (total tokens launched and active launches)
 *
 * @param totalTokens - Total number of tokens launched on the platform (all time)
 * @param activeLaunches - Number of currently active/unclaimed token launches
 */
export function Intro({ totalTokens = 0, activeLaunches = 0 }: IntroProps) {
  // Format large numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toString();
  };

  return (
    <div className="bg-neutral-900 text-white  rounded-xl border border-neutral-800 p-4 md:p-6">
      <div className=" mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 items-center">
          {/* Left image */}
          <div className="flex h-full px-2 md:col-span-1 xl:col-span-1">
            <img
              src={meme}
              alt={"sample meme"}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Center content */}
          <div className="space-y-4 md:space-y-6 col-span-1 md:col-span-1 xl:col-span-2 px-2">
            <h1 className="text-xl md:text-2xl ">
              Idea?
              <br />
              Launch It.
            </h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Create memes. Earn MEME. The more likes you get, the more tokens
              you earn — your viral memes turn into real rewards!
            </p>
            <Link
              to="/launch"
              className="flex items-center gap-3 w-fit rounded-full font-semibold text-sm bg-gradient-to-t  from-primary-900 to-black border border-primary-700  hover:shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)] px-3 py-2.5 transition-all duration-300"
            >
              Create Now
              <ChevronRight
                size={15}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Right stats - Real platform statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 h-full items-end gap-3 col-span-1 md:col-span-2 xl:col-span-2 px-2">
            <div className="space-y-2 bg-dark-900 rounded-md p-3">
              <p className="text-gray-400 text-xs">Total Tokens Launched</p>
              <div className="flex items-center gap-2 justify-between">
                <p className="text-sm font-semibold">{formatNumber(totalTokens)}</p>
                <TrendingUp className="text-primary-500 w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2 bg-dark-900 rounded-md p-3">
              <p className="text-gray-400 text-xs">Active Launches</p>
              <div className="flex items-center gap-2 justify-between">
                <p className="text-sm font-semibold">{formatNumber(activeLaunches)}</p>
                <Rocket className="text-yellow-500 w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
