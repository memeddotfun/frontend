import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";

/**
 * Token details with optional extended fields
 */
export interface TokenDetails {
  name: string;
  image: string;
  ticker?: string; // Only included when includeExtendedFields is true
  address?: `0x${string}`; // Only included when includeExtendedFields is true
  id?: string; // Token UUID (memeId) for routing - only included when includeExtendedFields is true
}

/**
 * Hook configuration options
 */
interface UseTokenDetailsMapOptions {
  /**
   * Include extended fields (ticker, address) in the response
   * Default: false (returns only name and image)
   */
  includeExtendedFields?: boolean;

  /**
   * Enable debug logging (should be false in production)
   * Default: false
   */
  enableDebugLogs?: boolean;
}

/**
 * Hook return value
 */
interface UseTokenDetailsMapReturn {
  /**
   * Map of token addresses (lowercase) to their details
   */
  tokenDetailsMap: Record<string, TokenDetails>;

  /**
   * Whether token details are currently being fetched
   */
  isLoading: boolean;

  /**
   * Error message if fetching failed
   */
  error: string | null;
}

/**
 * Shared hook to fetch and manage token details for a list of addresses
 *
 * This hook consolidates duplicated token fetching logic across multiple components.
 * It fetches token metadata from the API, with automatic fallback mechanisms and
 * proper cleanup using AbortController.
 *
 * @param addresses - Array of token addresses to fetch details for
 * @param options - Configuration options (extended fields, debug logging)
 * @returns Object containing tokenDetailsMap, isLoading, and error states
 *
 * @example
 * // Simple usage (name and image only)
 * const { tokenDetailsMap, isLoading } = useTokenDetailsMap(['0x123...', '0x456...']);
 *
 * @example
 * // With extended fields (includes ticker and address)
 * const { tokenDetailsMap } = useTokenDetailsMap(
 *   ['0x123...'],
 *   { includeExtendedFields: true }
 * );
 */
export function useTokenDetailsMap(
  addresses: string[],
  options: UseTokenDetailsMapOptions = {}
): UseTokenDetailsMapReturn {
  const { includeExtendedFields = false, enableDebugLogs = false } = options;
  const { user } = useAuthStore();

  // State management
  const [tokenDetailsMap, setTokenDetailsMap] = useState<
    Record<string, TokenDetails>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AbortController for cleanup on unmount or dependency change
    const abortController = new AbortController();
    const signal = abortController.signal;

    /**
     * Main function to build the token details map
     * Fetches token metadata from API with fallback mechanisms
     */
    const buildTokenDetailsMap = async () => {
      // Skip if no addresses provided
      if (!addresses || addresses.length === 0) {
        setTokenDetailsMap({});
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newTokenDetailsMap: Record<string, TokenDetails> = {};

        // Step 1: Initialize with user's own tokens (if available)
        if (user?.token) {
          user.token.forEach((token) => {
            if (token.address && !signal.aborted) {
              const addressKey = token.address.toLowerCase();
              newTokenDetailsMap[addressKey] = {
                name:
                  token.metadata?.name ||
                  `${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                image:
                  token.image?.s3Key || (token.metadata as any)?.imageKey || "",
                // Add extended fields if requested
                ...(includeExtendedFields && {
                  ticker: token.metadata?.ticker || "???",
                  address: token.address as `0x${string}`,
                  id: token.id, // Include memeId for routing
                }),
              };
            }
          });
        }

        // Step 2: Create set of unique addresses to fetch
        const uniqueAddresses = new Set(
          addresses.map((addr) => addr.toLowerCase())
        );

        // Step 3: Fetch details for tokens not in user's list
        for (const address of uniqueAddresses) {
          // Check if request was aborted
          if (signal.aborted) break;

          const addressKey = address.toLowerCase();

          // Skip if already in map from user's tokens
          if (newTokenDetailsMap[addressKey]) continue;

          try {
            // Primary API call: Fetch token by address
            if (enableDebugLogs) {
              console.log(`Fetching token by address: ${address}`);
            }

            const response = await apiClient.get(
              `/api/token-by-address/${address}`,
              { signal }
            );
            const responseData = response.data as any;

            // Backend wraps token in a 'token' field, extract it
            const tokenData = responseData?.token || responseData;

            // Extract metadata if available
            if (
              tokenData &&
              tokenData.metadata &&
              typeof tokenData.metadata === "object" &&
              !signal.aborted
            ) {
              const tokenMetadata = tokenData.metadata as {
                name?: string;
                ticker?: string;
                imageKey?: string;
              };

              if (enableDebugLogs) {
                console.log(`Successfully fetched token ${address}:`, tokenData);
              }

              newTokenDetailsMap[addressKey] = {
                name:
                  tokenMetadata.name ||
                  `${address.slice(0, 6)}...${address.slice(-4)}`,
                // Backend returns imageKey as full URL in metadata, use it directly
                image: tokenMetadata.imageKey || tokenData.image?.s3Key || "",
                // Add extended fields if requested
                ...(includeExtendedFields && {
                  ticker: tokenMetadata.ticker || "???",
                  address: tokenData.address || (address as `0x${string}`),
                  id: tokenData.id, // Include memeId for routing
                }),
              };
            } else if (!signal.aborted) {
              if (enableDebugLogs) {
                console.log(`Token ${address} not found via direct API call`);
              }
            }
          } catch (primaryError: any) {
            // Skip if request was aborted (component unmounted)
            if (signal.aborted) return;

            // Fallback: Try fetching all tokens and filtering
            // This is more expensive but ensures we get the data if the direct call fails
            if (includeExtendedFields) {
              try {
                const allTokensResponse = await apiClient.get("/api/tokens", {
                  signal,
                });

                if (enableDebugLogs) {
                  console.log("Fetching from /api/tokens endpoint as fallback");
                }

                // Handle different response formats
                const allTokensData = allTokensResponse.data as
                  | { tokens?: any[] }
                  | any[];
                const allTokens = Array.isArray(allTokensData)
                  ? allTokensData
                  : allTokensData &&
                    "tokens" in allTokensData &&
                    Array.isArray(allTokensData.tokens)
                  ? allTokensData.tokens
                  : [];

                // Find the specific token in the array
                const tokenData = allTokens.find((t: any) => {
                  return (
                    t &&
                    typeof t === "object" &&
                    "address" in t &&
                    t.address &&
                    typeof t.address === "string" &&
                    t.address.toLowerCase() === addressKey
                  );
                });

                if (
                  tokenData &&
                  tokenData.metadata &&
                  typeof tokenData.metadata === "object" &&
                  !signal.aborted
                ) {
                  const tokenMetadata = tokenData.metadata as {
                    name?: string;
                    ticker?: string;
                    imageKey?: string;
                  };

                  if (enableDebugLogs) {
                    console.log(`Found token ${address} in all tokens`);
                  }

                  newTokenDetailsMap[addressKey] = {
                    name:
                      tokenMetadata.name ||
                      `${address.slice(0, 6)}...${address.slice(-4)}`,
                    // Backend returns imageKey as full URL in metadata, use it directly
                    image: tokenMetadata.imageKey || tokenData.image?.s3Key || "",
                    ticker: tokenMetadata.ticker || "???",
                    address: tokenData.address || (address as `0x${string}`),
                    id: tokenData.id, // Include memeId for routing
                  };
                } else if (!signal.aborted) {
                  // Use fallback if not found
                  if (enableDebugLogs) {
                    console.log(`Token ${address} not found in all tokens`);
                  }
                  newTokenDetailsMap[addressKey] = createFallbackTokenDetails(
                    address,
                    includeExtendedFields
                  );
                }
              } catch (fallbackError) {
                if (!signal.aborted) {
                  // Final fallback: Use address as name
                  newTokenDetailsMap[addressKey] = createFallbackTokenDetails(
                    address,
                    includeExtendedFields
                  );
                }
              }
            } else {
              // For simple fields, just use fallback (no need for expensive /api/tokens call)
              if (!signal.aborted) {
                newTokenDetailsMap[addressKey] = createFallbackTokenDetails(
                  address,
                  includeExtendedFields
                );
              }
            }
          }
        }

        // Update state only if not aborted
        if (!signal.aborted) {
          setTokenDetailsMap(newTokenDetailsMap);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!signal.aborted) {
          const errorMessage =
            err.message || "Failed to fetch token details";
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    buildTokenDetailsMap();

    // Cleanup function: abort ongoing requests when component unmounts
    return () => {
      abortController.abort();
    };
  }, [addresses.join(","), user?.token, includeExtendedFields, enableDebugLogs]);

  return { tokenDetailsMap, isLoading, error };
}

/**
 * Helper function to create fallback token details when API calls fail
 * Uses truncated address as the name
 *
 * @param address - Token address
 * @param includeExtendedFields - Whether to include ticker and address fields
 * @returns TokenDetails object with fallback values
 */
function createFallbackTokenDetails(
  address: string,
  includeExtendedFields: boolean
): TokenDetails {
  return {
    name: `${address.slice(0, 6)}...${address.slice(-4)}`,
    image: "",
    ...(includeExtendedFields && {
      ticker: "???",
      address: address as `0x${string}`,
    }),
  };
}
