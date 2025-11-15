import { useNavigate, useLoaderData } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import MintPriceAndHeat from "@/components/app/mint-warriors/MintPriceAndHeat";
import PriceHistory from "@/components/app/mint-warriors/PriceHistory";
import MintWarriorPanel from "@/components/app/mint-warriors/MintWarriorPanel";
import { useGetWarriorNFT } from "@/hooks/contracts/useMemedFactory";
import { memeTokenDetailLoader, type LoaderData } from "@/lib/api/loaders";
import type { Token } from "@/hooks/api/useAuth";

// Export the loader for this route
export { memeTokenDetailLoader as loader };

export default function MintWarriors() {
  const navigate = useNavigate();
  const { data: token, error } = useLoaderData() as LoaderData<Token>;

  // Get warrior NFT address for this token using the token's contract address
  const { data: warriorNFTAddress } = useGetWarriorNFT(token?.address as `0x${string}` | undefined);

  // Log warrior NFT address when available
  useEffect(() => {
    if (warriorNFTAddress) {
      console.log("Warrior NFT Address:", warriorNFTAddress);
    }
  }, [warriorNFTAddress]);

  // Use actual token name from metadata
  const tokenName = token?.metadata?.name || "Token";

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-500 cursor-pointer mb-6"
        >
          <ChevronLeft size={16} />
          Back to {tokenName}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Mint {tokenName} Warriors
          </h1>
          <p className="text-gray-400">
            Forge powerful warriors with dynamic pricing based on community heat
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            <MintPriceAndHeat />
            <PriceHistory
              warriorNFTAddress={warriorNFTAddress}
              tokenName={tokenName}
            />
          </div>

          {/* Right Column - Mint Warrior */}
          <div className="xl:col-span-1">
            <MintWarriorPanel
              warriorNFTAddress={warriorNFTAddress}
              tokenName={tokenName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
