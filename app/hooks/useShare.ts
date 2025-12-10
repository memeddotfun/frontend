/**
 * USE SHARE HOOK - React Hook for Token Sharing
 *
 * Provides stateful share functionality with:
 * - Loading state management
 * - Toast notifications for user feedback
 * - Rate limiting to prevent spam
 * - Error handling
 *
 * USAGE:
 * ```typescript
 * const { share, isSharing } = useShare();
 *
 * <button
 *   onClick={() => share({ tokenName: 'Doge', ticker: 'DOGE', fairLaunchId: '42' })}
 *   disabled={isSharing}
 * >
 *   {isSharing ? 'Sharing...' : 'Share'}
 * </button>
 * ```
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { shareToken, type ShareTokenParams } from '@/utils/share';

/**
 * Return type for useShare hook
 */
interface UseShareReturn {
  share: (params: ShareTokenParams) => Promise<void>; // Share function
  isSharing: boolean;                                  // Loading state
}

/**
 * USE SHARE HOOK
 *
 * Custom React hook for sharing tokens with state management.
 * Handles the entire share flow including:
 * - Web Share API / Clipboard fallback
 * - User feedback via toast notifications
 * - Loading state during share operation
 * - Rate limiting (1-second cooldown)
 *
 * FEATURES:
 * - Prevents spam clicks with isSharing state
 * - Shows success toast only for clipboard method (Web Share provides its own UI)
 * - Silently handles user cancellation (no error toast)
 * - Shows error toast only for actual failures
 *
 * @returns Object with share function and loading state
 *
 * @example
 * function MemeCard({ token }) {
 *   const { share, isSharing } = useShare();
 *
 *   const handleShare = () => {
 *     share({
 *       tokenName: token.name,
 *       ticker: token.ticker,
 *       fairLaunchId: token.fairLaunchId,
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleShare} disabled={isSharing}>
 *       {isSharing ? 'Sharing...' : 'Share'}
 *     </button>
 *   );
 * }
 */
export function useShare(): UseShareReturn {
  // Track sharing state to prevent spam and show loading UI
  const [isSharing, setIsSharing] = useState(false);

  /**
   * Share function with state management and user feedback
   *
   * FLOW:
   * 1. Check if already sharing (prevent spam)
   * 2. Set loading state
   * 3. Call shareToken utility
   * 4. Show appropriate toast notification
   * 5. Reset loading state after cooldown
   */
  const share = useCallback(async (params: ShareTokenParams) => {
    // Rate limiting: Prevent rapid successive shares
    if (isSharing) {
      return;
    }

    // Set loading state
    setIsSharing(true);

    try {
      // Call the core share utility function
      const result = await shareToken(params);

      // Handle success based on method used
      if (result.success && result.method === 'clipboard') {
        // Clipboard method: Show success toast
        // (Web Share API shows its own native UI, so no toast needed)
        toast.success('Link copied to clipboard!');
      }

      // Handle errors (excluding user cancellation)
      if (!result.success && result.error !== 'cancelled') {
        // Show generic error toast
        toast.error('Failed to share');
      }

      // Note: If user cancelled (error === 'cancelled'), we silently return
      // This is expected behavior when user dismisses the share sheet

    } catch (error) {
      // Unexpected error (should rarely happen as shareToken handles errors)
      console.error('Unexpected share error:', error);
      toast.error('Failed to share');
    } finally {
      // Reset loading state after 1-second cooldown
      // This prevents spam clicking and gives time for toast to display
      setTimeout(() => setIsSharing(false), 1000);
    }
  }, [isSharing]);

  return { share, isSharing };
}
