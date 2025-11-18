import { MemeCard } from './MemeCard';
import { useMemeTokens } from '@/hooks/api/useMemedApi';
import { Loader2 } from 'lucide-react';
import defaultMeme from "@/assets/images/meme.png";
import { useMemo } from 'react';

// Helper to format market cap
const formatMarketCap = (value: number): string => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export function TrendingMemes() {
  // Fetch all tokens from API
  const { data: tokensData, isLoading, error } = useMemeTokens();

  // Get top 4 trending tokens sorted by heat score (or market cap if no heat)
  const topMemes = useMemo(() => {
    if (!tokensData || !Array.isArray(tokensData)) return [];

    // Sort tokens by heat score (descending), with market cap as fallback
    const sortedTokens = [...tokensData].sort((a: any, b: any) => {
      const heatA = a.heat || 0;
      const heatB = b.heat || 0;

      // Primary sort: by heat score
      if (heatB !== heatA) {
        return heatB - heatA;
      }

      // Fallback sort: by market cap
      const capA = a.marketCap || 0;
      const capB = b.marketCap || 0;
      return capB - capA;
    });

    // Take top 4 and format
    return sortedTokens.slice(0, 4).map((token: any) => ({
      id: token.id || token.address,
      address: token.address,
      title: token.metadata?.name || token.name || 'Unnamed Token',
      creator: token.userId ? `${token.userId.slice(0, 6)}...` : 'Anonymous',
      image: token.image?.s3Key || token.metadata?.imageKey || defaultMeme,
      marketCap: formatMarketCap(token.marketCap || 0),
      heat: token.heat || 0,
      change24h: token.change24h || 0,
    }));
  }, [tokensData]);

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Trending Memes
          </h2>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Trending Memes
        </h2>

        {/* Show message if no data */}
        {(!topMemes || topMemes.length === 0) && !error && (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg mb-4">
              No trending memes yet. Be the first to create one!
            </p>
            <a
              href="/app/launch"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/50"
            >
              Launch Your Meme Token
            </a>
          </div>
        )}

        {/* Show error message if there's an API error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg">
              Unable to load trending memes. Please try again later.
            </p>
          </div>
        )}

        {/* Show memes grid if we have data */}
        {topMemes && topMemes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {topMemes.map((meme) => (
              <MemeCard
                key={meme.id}
                address={meme.address}
                title={meme.title}
                creator={meme.creator}
                image={meme.image}
                marketCap={meme.marketCap}
                heat={meme.heat}
                change24h={meme.change24h}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}