import { Wallet } from "lucide-react";
import { ClientConnectButton } from "./ClientConnectButton";

interface ConnectWalletPromptProps {
  /**
   * Custom message to display (optional)
   * Default: "Connect your wallet to continue"
   */
  message?: string;

  /**
   * Display variant:
   * - "button": Renders as a button (replaces action buttons)
   * - "card": Renders as a card with icon and description (for full-page prompts)
   * - "inline": Renders as inline text with button (for forms)
   */
  variant?: "button" | "card" | "inline";

  /**
   * Additional CSS classes for customization
   */
  className?: string;
}

/**
 * Reusable component to prompt users to connect wallet
 * Used across the app to gate contract interactions behind authentication
 *
 * Usage examples:
 * - Replace claim buttons: <ConnectWalletPrompt variant="button" />
 * - Form submissions: <ConnectWalletPrompt variant="inline" message="Connect to launch token" />
 * - Full page prompts: <ConnectWalletPrompt variant="card" />
 */
export function ConnectWalletPrompt({
  message = "Connect your wallet to continue",
  variant = "button",
  className = ""
}: ConnectWalletPromptProps) {

  // Button variant - replaces action buttons (claim, vote, etc.)
  if (variant === "button") {
    return <ClientConnectButton />;
  }

  // Card variant - full-width card with icon and description
  if (variant === "card") {
    return (
      <div className={`bg-neutral-900 rounded-xl p-8 border border-neutral-800 text-center ${className}`}>
        <Wallet className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Wallet Connection Required
        </h3>
        <p className="text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex justify-center">
          <ClientConnectButton />
        </div>
      </div>
    );
  }

  // Inline variant - compact inline message with button
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800 ${className}`}>
        <Wallet className="w-5 h-5 text-green-500 flex-shrink-0" />
        <p className="text-gray-300 flex-1">{message}</p>
        <ClientConnectButton />
      </div>
    );
  }

  // Default fallback to button
  return <ClientConnectButton />;
}
