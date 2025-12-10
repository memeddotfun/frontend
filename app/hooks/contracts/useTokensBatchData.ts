import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { FACTORY_ADDRESS, TOKEN_SALE_ADDRESS } from "@/config/contracts";
import { factoryAbi, memedTokenSaleAbi } from "@/abi";
import { baseSepolia } from "wagmi/chains";

/**
 * Combined contract data for a single token
 */
export interface TokenContractData {
  tokenData: any; // Raw tuple from tokenData contract call
  fairLaunchData: any; // Raw tuple from fairLaunchData contract call
  isRefundable: boolean | undefined;
  isUnclaimed: boolean; // Calculated field: token not claimed by creator
  isFailed: boolean; // Calculated field: launch failed or refundable
  status: number; // Fair launch status: 0=NOT_STARTED, 1=ACTIVE, 2=COMPLETED, 3=FAILED
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook return type - map of fairLaunchId to contract data
 */
export interface TokensBatchDataReturn {
  /**
   * Map of fairLaunchId (as string) to combined contract data
   */
  dataMap: Record<string, TokenContractData>;

  /**
   * Whether any of the queries are loading
   */
  isLoading: boolean;

  /**
   * Whether all queries have completed (success or error)
   */
  isComplete: boolean;
}

/**
 * Centralized hook to batch-fetch contract data for multiple tokens
 *
 * This uses wagmi's useReadContracts (multicall) to batch all contract reads
 * into a single hook call, avoiding Rules of Hooks violations.
 *
 * @param fairLaunchIds - Array of fairLaunchId strings to fetch data for
 * @returns Object with dataMap (fairLaunchId -> TokenContractData) and loading states
 *
 * @example
 * ```tsx
 * // In explore.tsx - fetch once for all tokens
 * const { dataMap, isLoading } = useTokensBatchData(
 *   tokens.map(t => t.fairLaunchId).filter(Boolean)
 * );
 *
 * // Pass to child components
 * <MemeTokensList tokens={tokens} contractDataMap={dataMap} />
 *
 * // In MemeTokenCard.tsx - use pre-fetched data
 * const contractData = contractDataMap[token.fairLaunchId];
 * const isFailed = contractData?.isFailed ?? false;
 * ```
 */
export function useTokensBatchData(
  fairLaunchIds: (string | undefined)[]
): TokensBatchDataReturn {
  // Ensure fairLaunchIds is always an array
  const safeIds = Array.isArray(fairLaunchIds) ? fairLaunchIds : [];

  // Filter and deduplicate - stable reference to avoid infinite loops
  const validIds = useMemo(() => {
    return Array.from(
      new Set(safeIds.filter((id): id is string => !!id))
    );
  }, [safeIds.join(',')]);

  // Build contracts array for multicall
  // For each token, we need 3 calls: tokenData, fairLaunchData, isRefundable
  const contracts = useMemo(() => {
    return validIds.flatMap(id => {
      const tokenId = BigInt(id);
      return [
        {
          address: FACTORY_ADDRESS,
          abi: factoryAbi,
          functionName: 'tokenData',
          args: [tokenId],
        },
        {
          address: TOKEN_SALE_ADDRESS,
          abi: memedTokenSaleAbi,
          functionName: 'fairLaunchData',
          args: [tokenId],
          chainId: baseSepolia.id,
        },
        {
          address: TOKEN_SALE_ADDRESS,
          abi: memedTokenSaleAbi,
          functionName: 'isRefundable',
          args: [tokenId],
        },
      ] as const;
    });
  }, [validIds.join(',')]);

  // Single multicall hook - no Rules of Hooks violation!
  const { data: results, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: validIds.length > 0,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Parse multicall results into dataMap
  const dataMap = useMemo(() => {
    const map: Record<string, TokenContractData> = {};

    if (!results) return map;

    // Results are in groups of 3 per token (tokenData, fairLaunchData, isRefundable)
    validIds.forEach((id, index) => {
      const baseIndex = index * 3;
      
      const tokenDataResult = results[baseIndex];
      const fairLaunchDataResult = results[baseIndex + 1];
      const isRefundableResult = results[baseIndex + 2];

      // Extract data from results
      const tokenData = tokenDataResult?.status === 'success' ? tokenDataResult.result : null;
      const fairLaunchData = fairLaunchDataResult?.status === 'success' ? fairLaunchDataResult.result : null;
      const isRefundable = isRefundableResult?.status === 'success' ? isRefundableResult.result as boolean : undefined;

      // Calculate derived fields
      // tokenData structure: [token, warriorNFT, creator, isClaimedByCreator, ...]
      // isClaimedByCreator is at index 3
      const isUnclaimed = tokenData ? !(tokenData as any)[3] : false;

      // Determine status and if failed
      const status = fairLaunchData ? (fairLaunchData as any)[0] : 0;
      const isFailed = isRefundable === true || status === 3;

      // Check for errors
      const hasError = tokenDataResult?.status === 'failure';
      const error = hasError && tokenDataResult?.error ? tokenDataResult.error as Error : null;

      map[id] = {
        tokenData,
        fairLaunchData,
        isRefundable,
        isUnclaimed,
        isFailed,
        status,
        isLoading: false, // Individual items are not loading once we have results
        error,
      };
    });

    return map;
  }, [results, validIds.join(',')]);

  // Calculate aggregate states
  const isComplete = !isLoading && results !== undefined;

  return {
    dataMap,
    isLoading,
    isComplete,
  };
}
