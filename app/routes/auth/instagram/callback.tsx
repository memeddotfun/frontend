import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useConnectInstagram } from "@/hooks/api/useMemedApi";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { Loader2, Instagram } from "lucide-react";

/**
 * Instagram OAuth Callback Route
 * Handles the redirect from Instagram after user authorizes the app
 * Extracts authorization code from URL and sends it to backend for account linking
 */
export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: connectInstagram, loading: isConnecting } = useConnectInstagram();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract code or error from URL query parameters
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");
    const errorDescription = searchParams.get("error_description");

    // Handle error case - user denied authorization or error occurred
    if (errorParam) {
      const errorMessage = errorDescription || errorReason || "Authorization failed";
      console.error("Instagram OAuth error:", { errorParam, errorReason, errorDescription });

      setError(errorMessage);
      toast.error(`Instagram: ${errorMessage}`);

      // Redirect back to launch after 2 seconds
      setTimeout(() => {
        navigate("/launch");
      }, 2000);
      return;
    }

    // Handle success case - we have authorization code
    if (code) {
      console.log("Instagram OAuth code received, connecting account...");

      connectInstagram({ code })
        .then(() => {
          console.log("Instagram account linked successfully");
          toast.success("Instagram account linked successfully!");

          // Refresh user session to get updated social accounts
          useAuthStore.getState().verifySession();

          // Redirect back to launch page
          navigate("/launch");
        })
        .catch((err) => {
          console.error("Failed to connect Instagram:", err);

          // Handle specific error messages from backend
          const errorMsg = err?.response?.data?.error || "Failed to link Instagram account";
          setError(errorMsg);
          toast.error(errorMsg);

          // Redirect back to launch after 2 seconds
          setTimeout(() => {
            navigate("/launch");
          }, 2000);
        });
    } else {
      // No code and no error - invalid callback
      console.error("Instagram callback: No code or error parameter found");
      setError("Invalid callback - missing code parameter");
      toast.error("Invalid Instagram callback");

      setTimeout(() => {
        navigate("/launch");
      }, 2000);
    }
  }, [searchParams, connectInstagram, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950">
      <div className="text-center max-w-md px-4">
        {/* Instagram Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Instagram className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Loading State */}
        {isConnecting && !error && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Connecting Instagram...
            </h2>
            <p className="text-neutral-400">
              Please wait while we link your Instagram Business account
            </p>
          </>
        )}

        {/* Error State */}
        {error && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-neutral-400 mb-4">{error}</p>
            <p className="text-sm text-neutral-500">
              Redirecting back to launch...
            </p>
          </>
        )}

        {/* Initial Processing State (before API call) */}
        {!isConnecting && !error && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Processing...
            </h2>
            <p className="text-neutral-400">
              Verifying your Instagram authorization
            </p>
          </>
        )}
      </div>
    </div>
  );
}
