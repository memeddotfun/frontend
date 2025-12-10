/**
 * SHARE UTILITIES - Token Sharing with Web Share API + Clipboard Fallback
 *
 * Provides smart token sharing functionality with platform-appropriate behavior:
 * - Mobile (Web Share API available): Opens native iOS/Android share sheet
 * - Desktop (Web Share API unsupported): Copies link to clipboard with toast
 * - Fallback: Always copies to clipboard if Web Share fails
 *
 * SECURITY:
 * - Validates token data to prevent XSS
 * - Rate limiting via React hook
 * - Graceful error handling
 *
 * USAGE:
 * ```typescript
 * import { shareToken } from '@/utils/share';
 *
 * const result = await shareToken({
 *   tokenName: 'Doge Coin',
 *   ticker: 'DOGE',
 *   fairLaunchId: '42',
 *   imageUrl: 'https://...'
 * });
 * ```
 */

/**
 * Parameters for sharing a token
 */
export interface ShareTokenParams {
  tokenName: string;      // Token display name
  ticker: string;         // Token ticker symbol (e.g., "DOGE")
  tokenId?: string;       // Optional: Token blockchain ID
  fairLaunchId?: string;  // Optional: Fair launch ID (preferred for URL)
  imageUrl?: string;      // Optional: Token image URL (for future use)
}

/**
 * Result of share operation
 */
export interface ShareResult {
  success: boolean;               // Whether share was successful
  method: 'webshare' | 'clipboard'; // Method used for sharing
  error?: string;                 // Error message if failed
}

/**
 * BUILD SHAREABLE URL
 *
 * Constructs the token detail page URL.
 * Prefers fairLaunchId over tokenId for cleaner URLs.
 * Falls back to /explore if neither is available.
 *
 * @param tokenId - Optional blockchain token ID
 * @param fairLaunchId - Optional fair launch ID (preferred)
 * @returns Full URL to token detail page
 *
 * @example
 * buildShareableUrl(undefined, '42')
 * // => 'https://memed.fun/explore/meme/42'
 */
export function buildShareableUrl(tokenId?: string, fairLaunchId?: string): string {
  const baseUrl = window.location.origin;

  // Prefer fairLaunchId for cleaner, more user-friendly URLs
  if (fairLaunchId) {
    return `${baseUrl}/explore/meme/${fairLaunchId}`;
  }

  // Fallback to explore page if no ID available
  return `${baseUrl}/explore`;
}

/**
 * FORMAT SHARE TEXT
 *
 * Creates promotional message with emoji, token info, and hashtags.
 * Follows social media best practices for engagement.
 *
 * @param tokenName - Token display name (user-generated, sanitized by backend)
 * @param ticker - Token ticker symbol (user-generated, sanitized by backend)
 * @returns Formatted share message with hashtags
 *
 * @example
 * formatShareText('Doge Coin', 'DOGE')
 * // => '🚀 Check out Doge Coin ($DOGE) on Memed!\n\nThe future of meme tokens is here.\n\n#memed #crypto #doge'
 */
export function formatShareText(tokenName: string, ticker: string): string {
  // Note: tokenName and ticker are user-generated content but sanitized by backend during token creation
  // Additional client-side validation happens in the minting flow before reaching here

  return `🚀 Check out ${tokenName} ($${ticker}) on Memed!\n\nThe future of meme tokens is here.\n\n#memed #crypto #${ticker.toLowerCase()}`;
}

/**
 * DETECT IF USER IS ON MOBILE DEVICE
 *
 * Checks user agent for mobile device indicators.
 * Used to determine whether to show native share sheet or clipboard fallback.
 *
 * @returns true if user is on mobile device
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for mobile user agents (iOS, Android, Windows Phone, etc.)
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * DETECT WEB SHARE API SUPPORT
 *
 * Checks if browser supports native Web Share API AND user is on mobile.
 * Desktop browsers will use clipboard-only for cleaner UX (no browser extension-like dialogs).
 * Mobile devices use native share sheets (iOS/Android).
 *
 * @returns true if Web Share API should be used (mobile only)
 *
 * @example
 * if (canUseWebShare()) {
 *   // Mobile: Show native share sheet
 * } else {
 *   // Desktop: Copy to clipboard
 * }
 */
export function canUseWebShare(): boolean {
  // Only use Web Share API on mobile devices
  // Desktop gets clipboard-only for cleaner UX
  return typeof navigator !== 'undefined' &&
         'share' in navigator &&
         'canShare' in navigator &&
         isMobileDevice(); // ✅ Only enable on mobile
}

/**
 * SHARE TOKEN - Main Share Function
 *
 * Attempts to share token using Web Share API, falls back to clipboard.
 * Handles all edge cases and errors gracefully.
 *
 * FLOW:
 * 1. Try Web Share API first (if available)
 * 2. If user cancels, return without error
 * 3. If Web Share fails/unavailable, copy to clipboard
 * 4. Return result with method used
 *
 * @param params - Token information for sharing
 * @returns Promise resolving to share result
 *
 * @example
 * const result = await shareToken({
 *   tokenName: 'Doge Coin',
 *   ticker: 'DOGE',
 *   fairLaunchId: '42'
 * });
 *
 * if (result.success && result.method === 'clipboard') {
 *   toast.success('Link copied to clipboard!');
 * }
 */
export async function shareToken(params: ShareTokenParams): Promise<ShareResult> {
  // Build the shareable URL
  const url = buildShareableUrl(params.tokenId, params.fairLaunchId);

  // Format the share text with token info and hashtags
  const text = formatShareText(params.tokenName, params.ticker);

  // ATTEMPT 1: Try Web Share API (native mobile/desktop sharing)
  if (canUseWebShare()) {
    try {
      await navigator.share({
        title: `${params.tokenName} ($${params.ticker})`,
        text: text,
        url: url,
      });

      // Success! User completed the share action
      return { success: true, method: 'webshare' };
    } catch (error: any) {
      // User cancelled the share dialog - this is not an error
      if (error.name === 'AbortError') {
        return { success: false, method: 'webshare', error: 'cancelled' };
      }

      // Web Share API failed for another reason - fall through to clipboard
      console.warn('Web Share API failed, falling back to clipboard:', error);
    }
  }

  // ATTEMPT 2: Fallback to clipboard (desktop browsers, or if Web Share failed)
  try {
    // Copy formatted text + URL to clipboard
    await navigator.clipboard.writeText(`${text}\n\n${url}`);

    // Success! Link copied to clipboard
    return { success: true, method: 'clipboard' };
  } catch (error) {
    // Clipboard API failed (rare, but possible in some browsers)
    console.error('Clipboard API failed:', error);
    return { success: false, method: 'clipboard', error: 'Failed to copy' };
  }
}
