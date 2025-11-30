import { useMemo } from "react";
import { User, Wallet, Check, Settings2, Link as LinkIcon, ExternalLink, Instagram } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router";
import { ConnectWalletPrompt } from "@/components/shared/ConnectWalletPrompt";

// Type definitions for better type safety
interface SocialAccount {
  type: "LENS" | "TWITTER" | "INSTAGRAM";
  username: string;
  createdAt: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isAuthenticated } = useAuthStore();

  // Memoize display name - derived from address, no need for state
  const displayName = useMemo(() => {
    return user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "";
  }, [user?.address]);

  // Memoize social account lookups to avoid recalculating on every render
  const lensAccount = useMemo(() =>
    user?.socials?.find((social: SocialAccount) => social.type === "LENS") as SocialAccount | undefined,
    [user?.socials]
  );

  const twitterAccount = useMemo(() =>
    user?.socials?.find((social: SocialAccount) => social.type === "TWITTER") as SocialAccount | undefined,
    [user?.socials]
  );

  const instagramAccount = useMemo(() =>
    user?.socials?.find((social: SocialAccount) => social.type === "INSTAGRAM") as SocialAccount | undefined,
    [user?.socials]
  );

  // When disconnecting from Settings page, always redirect to home
  // Settings requires authentication, so user can't stay here after disconnect
  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  // Gate: Require wallet connection to view settings
  // Settings page shows personal account information which requires authentication
  if (!isAuthenticated || !address) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="container px-4 py-12 mx-auto">
          <div className="max-w-2xl mx-auto">
            <ConnectWalletPrompt
              variant="card"
              message="Connect your wallet to view and manage your account settings"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center bg-neutral-900 py-3 px-2 rounded-md gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-t  from-primary-900 to-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              <Settings2 />
            </span>
          </div>
          <h1 className="text-lg font-semibold">Account Overview</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Account Info Section */}
          <div className="space-y-6 bg-neutral-900 rounded-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-semibold">Account Information</h2>
            </div>

            <div className="space-y-6">
              {/* Wallet Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Wallet Address
                </label>
                <div className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-sm">
                  {address || "Not connected"}
                </div>
              </div>

              {/* Display Name (Read-only) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Display Name
                </label>
                <div className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm">
                  {displayName || "N/A"}
                </div>
              </div>

              {/* Account Stats - Summary of user activity */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {/* Support both 'token' and 'tokens' properties for flexibility */}
                    {(user as any)?.tokens?.length || (user as any)?.token?.length || 0}
                  </div>
                  <div className="text-sm text-neutral-400">Tokens Created</div>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {user?.socials?.length || 0}
                  </div>
                  <div className="text-sm text-neutral-400">Linked Accounts</div>
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-lg text-sm">
                <p className="mb-2">ℹ️ Profile updates are not available yet.</p>
                <p className="text-xs text-blue-300">
                  Your profile is automatically synced with your wallet and linked accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Wallet & Linked Accounts */}
          <div className="space-y-6">
            {/* Linked Accounts Section */}
            <div className="bg-neutral-900 rounded-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <LinkIcon className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Linked Accounts</h2>
              </div>

              <div className="space-y-4">
                {/* Lens Account - Shows connected Lens Protocol profile */}
                {lensAccount ? (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">L</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            Lens Protocol
                            <Check className="w-4 h-4 text-green-500" aria-label="Verified" />
                          </h3>
                          <p className="text-gray-400 text-sm">
                            @{lensAccount.username}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://lens.xyz/u/${lensAccount.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 transition-colors"
                        aria-label={`View @${lensAccount.username} on Lens Protocol`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      Linked {new Date(lensAccount.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                        <span className="text-neutral-500 font-bold text-sm">L</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Lens Protocol</h3>
                        <p className="text-gray-500 text-sm">Not linked</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Twitter Account - Future integration (currently not active) */}
                {twitterAccount ? (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">𝕏</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            Twitter (X)
                            <Check className="w-4 h-4 text-blue-500" aria-label="Verified" />
                          </h3>
                          <p className="text-gray-400 text-sm">
                            @{twitterAccount.username}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://twitter.com/${twitterAccount.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        aria-label={`View @${twitterAccount.username} on Twitter`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      Linked {new Date(twitterAccount.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                        <span className="text-neutral-500 font-bold text-sm">𝕏</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Twitter (X)</h3>
                        <p className="text-gray-500 text-sm">Coming soon</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instagram Account - Shows connected Instagram Business account */}
                {instagramAccount ? (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            Instagram
                            <Check className="w-4 h-4 text-purple-500" aria-label="Verified" />
                          </h3>
                          <p className="text-gray-400 text-sm">
                            @{instagramAccount.username}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://instagram.com/${instagramAccount.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        aria-label={`View @${instagramAccount.username} on Instagram`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">
                      Linked {new Date(instagramAccount.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-neutral-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">Instagram</h3>
                        <p className="text-gray-500 text-sm">Not linked</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-3 rounded-lg text-xs">
                  💡 Linked accounts are used during token creation to verify ownership and build trust.
                </div>
              </div>
            </div>

            {/* Wallet Connection Section */}
            <div className="bg-neutral-900 rounded-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Wallet Connection</h2>
              </div>

              {/* Primary Wallet */}
              <div className="rounded-lg p-4 space-y-4 bg-neutral-800 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">Primary Wallet</h3>
                    <p className="text-gray-400 text-sm font-mono break-all">
                      {address || "Not connected"}
                    </p>
                  </div>
                  {address && (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium ml-3">
                      Connected
                    </div>
                  )}
                </div>
              </div>

              {/* Network */}
              <div className="rounded-lg p-4 space-y-4 bg-neutral-800 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Network</h3>
                    <p className="text-gray-400 text-sm">
                      {chain?.name || "Unknown Network"}
                    </p>
                  </div>
                  {chain && (
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Active
                    </div>
                  )}
                </div>
              </div>

              {/* Account Created */}
              {user?.createdAt && (
                <div className="rounded-lg p-4 bg-neutral-800 mb-4">
                  <h3 className="font-semibold text-white mb-1">Member Since</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {/* Disconnect Button - Securely disconnects wallet and clears session */}
              <div className="pt-4">
                <button
                  onClick={handleDisconnect}
                  className="w-full cursor-pointer border border-red-600 text-red-400 px-4 py-3 rounded-md font-semibold hover:bg-red-600/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  aria-label="Disconnect wallet and return to home page"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
