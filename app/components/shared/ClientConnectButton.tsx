"use client";

import { useEffect, useState } from "react";
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

export function ClientConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [signInStatus, setSignInStatus] = useState("idle"); // 'idle', 'getting_nonce', 'signing', 'connecting'

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
  const { mutate: disconnectWallet, loading: isDisconnecting } =
    useDisconnectWallet({
      onSuccess: () => {
        console.log("Backend logout successful. Clearing client state.");
        useAuthStore.getState().clearAuth();
        disconnect();
        navigate("/");
      },
      onError: (error: Error) => {
        console.error("Backend logout failed:", error);
        useAuthStore.getState().clearAuth();
        disconnect();
        navigate("/");
      },
    });

  // Wagmi hook to sign a message
  const { signMessage } = useSignMessage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Trigger sign-in flow when wallet connects and user is not authenticated
  useEffect(() => {
    if (
      isConnected &&
      address &&
      !isAuthenticated &&
      !isAuthLoading &&
      signInStatus === "idle"
    ) {
      console.log("Wallet connected, starting sign-in flow...");
      setSignInStatus("getting_nonce");
      createNonce({ address });
    }
  }, [
    isConnected,
    address,
    isAuthenticated,
    isAuthLoading,
    signInStatus,
    createNonce,
  ]);

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
            setSignInStatus("idle"); // Reset on error
          },
        },
      );
    }
  }, [nonceData, signInStatus, signMessage, address, connectWallet]);

  // 3. Handle successful authentication by re-verifying the session
  useEffect(() => {
    if (authData?.message && signInStatus === "connecting") {
      console.log("Backend connection successful. Verifying session...");
      useAuthStore.getState().verifySession();
      setSignInStatus("idle"); // Reset after successful authentication
    }
  }, [authData, signInStatus]);

  // 4. Reset flow if wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setSignInStatus("idle");
    }
  }, [isConnected]);

  // 5. Global error handling
  useEffect(() => {
    if (nonceError || authError) {
      console.error(
        "An error occurred during the auth flow:",
        nonceError || authError,
      );
      // setSignInStatus("idle"); // Do not reset to idle, to prevent infinite loop on error
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
