import { usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import { parseAbiItem } from "viem";

/**
 * Interface for price point with timestamp from blockchain events
 */
interface PricePoint {
  price: bigint;
  timestamp: number;
}

/**
 * Hook to fetch historical mint prices from WarriorMinted blockchain events.
 *
 * This hook:
 * 1. Queries WarriorMinted events from the blockchain (recent blocks only)
 * 2. Gets timestamp for each event from block data
 * 3. Returns sorted price history (oldest to newest)
 *
 * @param nftAddress The warrior NFT contract address
 * @param maxBlocksBack Maximum number of blocks to look back (default: 100k blocks, ~2-3 weeks)
 * @returns Price history array and loading state
 */
export function useWarriorPriceHistory(
  nftAddress: `0x${string}` | undefined,
  maxBlocksBack: bigint = 100000n
) {
  const publicClient = usePublicClient();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't fetch if no address or no client
    if (!nftAddress || !publicClient) return;

    const fetchPriceHistory = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      try {
        // Get current block number to calculate range
        const latestBlock = await publicClient.getBlockNumber();

        // Only fetch recent blocks to avoid slow queries
        // Calculate starting block: either maxBlocksBack ago, or block 0 if that's more recent
        const calculatedFromBlock =
          latestBlock > maxBlocksBack ? latestBlock - maxBlocksBack : 0n;

        // RPC providers have block range limits (typically 100k blocks)
        // We'll use 50k block chunks to be safe and avoid hitting limits
        const CHUNK_SIZE = 50000n;
        const blockRange = latestBlock - calculatedFromBlock;

        // If range is small enough, fetch in one go
        if (blockRange <= CHUNK_SIZE) {
          console.log(
            `Fetching warrior mints from block ${calculatedFromBlock} to ${latestBlock}`
          );

          const events = await publicClient.getLogs({
            address: nftAddress,
            event: parseAbiItem(
              "event WarriorMinted(uint256 indexed tokenId, address indexed owner, uint256 price)"
            ),
            fromBlock: calculatedFromBlock,
            toBlock: latestBlock,
          });

          console.log(`Found ${events.length} warrior mint events`);

          // Get timestamps for events
          const historyWithTimestamps = await Promise.all(
            events.map(async (event) => {
              const block = await publicClient.getBlock({
                blockNumber: event.blockNumber,
              });
              return {
                price: event.args.price!,
                timestamp: Number(block.timestamp),
              };
            })
          );

          // Sort by timestamp (oldest first)
          historyWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
          setPriceHistory(historyWithTimestamps);
          return;
        }

        // For larger ranges, fetch in chunks
        const allEvents: any[] = [];
        let currentFromBlock = calculatedFromBlock;
        const endBlock = latestBlock;

        while (currentFromBlock <= endBlock) {
          const currentToBlock =
            currentFromBlock + CHUNK_SIZE > endBlock
              ? endBlock
              : currentFromBlock + CHUNK_SIZE;

          // Query WarriorMinted events from blockchain
          const events = await publicClient.getLogs({
            address: nftAddress,
            event: parseAbiItem(
              "event WarriorMinted(uint256 indexed tokenId, address indexed owner, uint256 price)"
            ),
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          allEvents.push(...events);

          // Move to next chunk
          currentFromBlock = currentToBlock + 1n;
        }

        console.log(`Found ${allEvents.length} warrior mint events`);

        // Get timestamp for each event by fetching block data
        // Blockchain events don't directly include timestamps, but blocks do
        const historyWithTimestamps = await Promise.all(
          allEvents.map(async (event) => {
            const block = await publicClient.getBlock({
              blockNumber: event.blockNumber,
            });
            return {
              price: event.args.price!, // Mint price from event
              timestamp: Number(block.timestamp), // Block timestamp
            };
          })
        );

        // Sort by timestamp (oldest first) for proper chart display
        historyWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

        setPriceHistory(historyWithTimestamps);
      } catch (err) {
        console.error("Error fetching price history:", err);
        const errorMessage =
          err instanceof Error ? err : new Error("Failed to fetch price history");
        setError(errorMessage);
        setPriceHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [nftAddress, publicClient, maxBlocksBack]);

  return { priceHistory, isLoading, error };
}
