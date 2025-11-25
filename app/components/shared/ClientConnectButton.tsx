"use client";

import { useEffect, useState, useRef } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import {
  useCreateNonce,
  useConnectWallet,
  useDisconnectWallet,
} from "../../hooks/api/useAuth";
import { useAuthStore } from "@/store/auth";
import { UserDetail } from "./UserDetail";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function ClientConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [signInStatus, setSignInStatus] = useState("idle"); // 'idle', 'getting_nonce', 'signing', 'connecting'
  const [authAttempted, setAuthAttempted] = useState(false); // Track if auth was attempted for this connection

  // Debounce timer to prevent immediate logout on temporary wallet disconnections
  // This prevents redirects during transaction signing when wallet briefly disconnects
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { address, isConnected } = useAccount();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  // API Hooks
  const {
    mutate: createNonce,
    data: nonceData,
    error: nonceError,
  } = useCreateNonce();
  const {
    mutate: connectWallet,
    data: authData,
    error: authError,
  } = useConnectWallet();
  // Smart redirect: Only redirect if user is on an auth-required page
  // Public pages (explore, token details, battles, home) - stay on page
  // Auth-required pages (settings, rewards, creator dashboard) - redirect to home
  const handleDisconnectRedirect = () => {
    const currentPath = window.location.pathname;

    // Pages that REQUIRE authentication - redirect to home
    const authRequiredPages = [
      '/settings',
      '/rewards',
      '/creator',
      '/launch', // While launch is technically accessible, better UX to redirect after disconnect
    ];

    const requiresAuth = authRequiredPages.some(page => currentPath.includes(page));

    if (requiresAuth) {
      console.log("Disconnected from auth-required page, redirecting to home");
      navigate("/");
    } else {
      console.log("Disconnected from public page, staying on current page");
      // Stay on current page - user can continue browsing
    }
  };

  const { mutate: disconnectWallet, loading: isDisconnecting } =
    useDisconnectWallet({
      onSuccess: () => {
        console.log("Backend logout successful. Clearing client state.");
        useAuthStore.getState().clearAuth();
        disconnect();
        handleDisconnectRedirect();
      },
      onError: (error: Error) => {
        console.error("Backend logout failed:", error);
        useAuthStore.getState().clearAuth();
        disconnect();
        handleDisconnectRedirect();
      },
    });

  // Wagmi hook to sign a message
  const { signMessage } = useSignMessage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset auth attempt flag when wallet changes (with debounce for disconnects)
  // Debounce prevents immediate auth reset during temporary disconnections (e.g., during transaction signing)
  useEffect(() => {
    // Clear any existing timeout when connection state changes
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }

    if (!isConnected || !address) {
      // Wait 3 seconds before resetting auth state
      // This prevents logout during temporary wallet disconnections during transaction signing
      console.log("Wallet disconnected. Waiting 3s before resetting auth...");
      disconnectTimeoutRef.current = setTimeout(() => {
        console.log("Timeout expired. Resetting auth state.");
        setAuthAttempted(false);
        setSignInStatus("idle");
      }, 3000);
    } else {
      // Wallet is connected, cancel any pending disconnect
      console.log("Wallet connected. Cancelling disconnect timeout.");
    }

    // Cleanup timeout on unmount
    return () => {
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, [isConnected, address]);

  // 1. Trigger sign-in flow when wallet connects and user is not authenticated
  useEffect(() => {
    // Only attempt auth once per connection and when not already authenticated
    if (
      isConnected && 
      address && 
      !isAuthenticated && 
      !authAttempted && 
      signInStatus === "idle"
    ) {
      console.log("Wallet connected, starting auth flow...");
      setAuthAttempted(true);
      setSignInStatus("getting_nonce");
      createNonce({ address });
    }
  }, [isConnected, address, isAuthenticated, authAttempted, signInStatus]);

  // 2. Sign message when nonce is received
  useEffect(() => {
    if (nonceData?.nonce && signInStatus === "getting_nonce") {
      console.log("Nonce received, prompting for signature...");
      setSignInStatus("signing");
      signMessage(
        { message: nonceData.nonce },
        {
          onSuccess: (signature) => {
            console.log("Message signed, connecting to backend...");
            setSignInStatus("connecting");
            if (address) {
              connectWallet({ address, signature, message: nonceData.nonce });
            }
          },
          onError: (error: Error) => {
            console.error("Failed to sign message:", error);
            setSignInStatus("idle");

            // Distinguish between user rejection vs technical failure
            const isUserRejection =
              error.name === "UserRejectedRequestError" ||
              error.message?.toLowerCase().includes("user rejected") ||
              error.message?.toLowerCase().includes("user denied") ||
              error.message?.toLowerCase().includes("user cancelled");

            if (isUserRejection) {
              // User intentionally rejected signature - just reset state, allow retry
              // Don't disconnect wallet, they might want to try again
              toast.error("Signature rejected. Please try again when ready.");
            } else {
              // Technical failure (wallet provider stale, network error, etc.)
              // Auto-disconnect to clear stuck state
              toast.error("Wallet connection error. Please reconnect your wallet.");
              useAuthStore.getState().clearAuth();
              disconnectWallet();
            }
          },
        },
      );
    }
  }, [nonceData, signInStatus, signMessage, address, connectWallet]);

  // 3. Handle successful authentication by re-verifying the session
  useEffect(() => {
    if (authData?.message && signInStatus === "connecting") {
      console.log("Backend connection successful. Verifying session...");
      useAuthStore.getState().verifySession(disconnect);
      setSignInStatus("idle"); // Reset after successful authentication
    }
  }, [authData, signInStatus, disconnect]);

  // 4. Global error handling - Show specific errors to users
  useEffect(() => {
    if (nonceError || authError) {
      const error = nonceError || authError;
      console.error("Auth flow error:", error);

      // Show user-friendly error message based on error type
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (error?.message?.includes("timeout")) {
        toast.error("Connection timeout. Please try again.");
      } else if (error?.message?.includes("500") || error?.message?.includes("Internal Server")) {
        toast.error("Server error. Please try again in a moment.");
      } else {
        // Generic error with the actual message
        toast.error(`Connection failed: ${error?.message || "Unknown error"}`);
      }

      // Reset state immediately (no 3-second delay) to allow quick retry
      setSignInStatus("idle");
      setAuthAttempted(false);
    }
  }, [nonceError, authError]);

  const handleDisconnect = () => {
    console.log("Initiating disconnect...");
    disconnectWallet();
  };

  if (!mounted || isAuthLoading) {
    return <div className="h-10 w-48 bg-gray-800 rounded-lg animate-pulse" />;
  }

  if (isAuthenticated) {
    return (
      <UserDetail
        onDisconnect={handleDisconnect}
        isDisconnecting={isDisconnecting}
      />
    );
  }

  return <ConnectKitButton />;
}
