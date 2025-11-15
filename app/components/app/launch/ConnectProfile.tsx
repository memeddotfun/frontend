import { toast } from "sonner";
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ChevronRightIcon, LinkIcon, Check } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useConnectSocial, type Social } from "@/hooks/api/useAuth";

interface Account {
  username: {
    localName: string;
  };
}

interface TokenData {
  exists: boolean;
}

export default function ConnectProfile({
  setStep,
  selectedAccount,
  isMintable,
  isMintableLoading,
}: {
  setStep: (step: number) => void;
  selectedAccount: Account | null;
  isMintable?: boolean;
  isMintableLoading?: boolean;
}) {
  const { user } = useAuthStore();
  const { mutate: connectSocial, loading: isConnecting } = useConnectSocial();

  const [isLoadingTokenData, setIsLoadingTokenData] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [lensUsername, setLensUsername] = useState("");

  const isLensLinked = useMemo(() => {
    return user?.socials.some((social) => social.type === "LENS");
  }, [user]);

  useEffect(() => {
    setIsLoadingTokenData(true);
    setTimeout(() => {
      if (selectedAccount?.username.localName === "userwithtoken") {
        setTokenData({ exists: true });
      } else {
        setTokenData(null);
      }
      setIsLoadingTokenData(false);
    }, 1000);
  }, [selectedAccount]);

  const handleLinkSocial = async (platform: "lens" | "twitter") => {
    const username = lensUsername;
    if (!username) {
      toast.error(`Please enter a ${platform} username.`);
      return;
    }

    const type = platform.toUpperCase() as "LENS" | "TWITTER";

    try {
      await connectSocial({ type, username });
      toast.success(`${platform} account linked successfully!`);
      useAuthStore.getState().verifySession(); // Refetch user data
      setLensUsername("");
    } catch (err) {
      toast.error(
        (err as Error).message || `Failed to link ${platform} account.`,
      );
    }
  };

  if (isLoadingTokenData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full anilinkte-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Connect Socials
          </h1>
          <p className="text-sm text-neutral-400">
            Link your social accounts to enhance visibility
          </p>
        </div>

        {/* Connected Accounts */}
        {user?.socials && user.socials.length > 0 && (
          <div className="mb-12">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">
              Connected
            </h2>
            <div className="space-y-2">
              {user.socials.map((social: Social) => (
                <div
                  key={social.id}
                  className="flex items-center justify-between py-3 px-4 bg-neutral-900/50 rounded border border-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white capitalize">
                      {social.type.toLowerCase()}
                    </span>
                    <span className="text-sm text-neutral-500">
                      @{social.username}
                    </span>
                  </div>
                  <Check size={16} className="text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link New Accounts */}
        <div className="space-y-8">
          {/* Lens */}
          {!isLensLinked && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-400">
                  Lens
                </label>
                <a
                  href="https://onboarding.lens.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors underline underline-offset-2"
                >
                  Don't have an account?
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="username"
                  value={lensUsername}
                  onChange={(e) => setLensUsername(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                />
                <button
                  onClick={() => handleLinkSocial("lens")}
                  disabled={isConnecting}
                  className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded cursor-pointer hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Linking..." : "Link"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mintable Status Warning */}
        {!isMintableLoading && isMintable === false && (
          <div className="mt-8 bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-1">❌ Not Eligible to Launch</h3>
            <p className="text-xs text-red-300">
              Your wallet address is not currently eligible to launch tokens.
              Please check the eligibility requirements or contact support for more information.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end mt-12 pt-8 border-t border-neutral-800">
          {!tokenData ? (
            <button
              onClick={() => setStep(2)}
              disabled={
                !user?.socials ||
                user.socials.length === 0 ||
                isMintableLoading ||
                isMintable === false
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 rounded-md  text-black text-sm font-medium hover:shadow-2xl  cursor-pointer  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMintableLoading ? "Checking eligibility..." : "Continue"}
              <ChevronRightIcon size={16} />
            </button>
          ) : (
            <p className="text-sm text-neutral-500">
              You already have a meme token
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
