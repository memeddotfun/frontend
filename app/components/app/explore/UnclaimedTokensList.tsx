import { useMemo } from "react";
import { Unlock } from "lucide-react";
import type { Token } from "@/hooks/api/useAuth";
import type { TokenContractData } from "@/hooks/contracts/useTokensBatchData";
import { MemeTokenCard } from "./MemeTokenCard";
import meme from "@/assets/images/meme.png";

interface UnclaimedTokensListProps {
  tokens: Token[];
  contractDataMap: Record<string, TokenContractData>;
}

// Component to render token with pre-fetched claim status
function TokenClaimStatus({
  token,
  contractData,
  children,
}: {
  token: Token;
  contractData?: TokenContractData;
  children: (isUnclaimed: boolean, isLoading: boolean) => React.ReactNode;
}) {
  // Use pre-fetched contract data instead of making individual calls
  const isUnclaimed = contractData?.isUnclaimed ?? false;
  const isLoading = contractData?.isLoading ?? false;

  return <>{children(isUnclaimed, isLoading)}</>;
}

export function UnclaimedTokensList({ tokens, contractDataMap }: UnclaimedTokensListProps) {
  // Filter tokens that have fairLaunchId (needed to check claim status)
  const tokensWithFairLaunch = useMemo(() => {
    return tokens.filter((token) => token.fairLaunchId);
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
          {tokensWithFairLaunch.map((token) => {
            // Get pre-fetched contract data for this token
            const contractData = token.fairLaunchId
              ? contractDataMap[token.fairLaunchId]
              : undefined;

            return (
              <TokenClaimStatus
                key={token.id}
                token={token}
                contractData={contractData}
              >
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
                    image: token.metadata?.imageUrl || meme,
                    fairLaunchId: token.fairLaunchId,
                  };

                  return (
                    <MemeTokenCard
                      token={memeToken}
                      linkTo={`/claim-token/${token.id}`}
                      isUnclaimed={true}
                      contractData={contractData}
                    />
                  );
                }}
              </TokenClaimStatus>
            );
          })}
        </div>
      )}
    </div>
  );
}
