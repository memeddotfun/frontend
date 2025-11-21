import { useMemo } from "react";
import { useGetTokenData } from "@/hooks/contracts/useMemedFactory";
import { Unlock } from "lucide-react";
import type { Token } from "@/hooks/api/useAuth";
import { MemeTokenCard } from "./MemeTokenCard";
import meme from "@/assets/images/meme.png";

interface UnclaimedTokensListProps {
  tokens: Token[];
}

// Component to check a single token's claim status
function TokenClaimStatus({
  token,
  children,
}: {
  token: Token;
  children: (isUnclaimed: boolean, isLoading: boolean) => React.ReactNode;
}) {
  // Get token data from contract using fairLaunchId
  const { data: tokenData, isLoading, error } = useGetTokenData(
    token.fairLaunchId ? BigInt(token.fairLaunchId) : BigInt(0)
  );

  // Check if token is unclaimed
  // tokenData structure: [token, warriorNFT, creator, name, ticker, description, image, isClaimedByCreator]
  // isClaimedByCreator is at index 7 (8th field)
  const isUnclaimed = tokenData
    ? !(tokenData as any)[7]
    : isLoading
      ? true // Show during loading
      : false; // Hide if data loaded but not unclaimed

  // Debug logging
  if (tokenData) {
    console.log(`Token ${token.id} (${token.metadata?.name}):`, {
      fairLaunchId: token.fairLaunchId,
      contractData: tokenData,
      isClaimedByCreator: (tokenData as any)[7],
      isUnclaimed,
    });
  }

  return <>{children(isUnclaimed, isLoading)}</>;
}

export function UnclaimedTokensList({ tokens }: UnclaimedTokensListProps) {
  // Filter tokens that have fairLaunchId (needed to check claim status)
  const tokensWithFairLaunch = useMemo(() => {
    const filtered = tokens.filter((token) => token.fairLaunchId);
    console.log("UnclaimedTokensList - Total tokens:", tokens.length);
    console.log("UnclaimedTokensList - Tokens with fairLaunchId:", filtered.length);
    console.log(
      "UnclaimedTokensList - Filtered tokens:",
      filtered.map((t) => ({ id: t.id, name: t.metadata?.name, fairLaunchId: t.fairLaunchId }))
    );
    return filtered;
  }, [tokens]);

  return (
    <div>
      {tokensWithFairLaunch.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <Unlock className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
          <p>No unclaimed tokens at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokensWithFairLaunch.map((token) => (
            <TokenClaimStatus key={token.id} token={token}>
              {(isUnclaimed, isLoading) => {
                // Only render if unclaimed
                if (!isUnclaimed) return null;

                // Convert token to MemeTokenCard format
                const memeToken = {
                  id: token.id,
                  name: token.metadata?.name || "Unnamed Token",
                  creator: token.userId && typeof token.userId === 'string' && token.userId.length >= 4
                    ? `user...${token.userId.slice(-4)}`
                    : "Unknown",
                  ticker: token.metadata?.ticker || "UNKN",
                  description: token.metadata?.description || "No description",
                  price: 0,
                  marketCap: "N/A",
                  progress: 0,
                  active: false,
                  badge: "Unclaimed",
                  badgeColor: "bg-yellow-500",
                  image: token.metadata?.imageKey || meme,
                  fairLaunchId: token.fairLaunchId,
                };

                return (
                  <MemeTokenCard
                    token={memeToken}
                    linkTo={`/claim-token/${token.id}`}
                    isUnclaimed={true}
                  />
                );
              }}
            </TokenClaimStatus>
          ))}
        </div>
      )}
    </div>
  );
}
