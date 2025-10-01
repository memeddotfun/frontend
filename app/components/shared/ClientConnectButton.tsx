"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import { useCreateNonce, useConnectWallet } from "../../hooks/api/useAuth";

export function ClientConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  // State to hold the nonce
  const [nonce, setNonce] = useState<string | null>(null);

  // API Hooks
  const {
    mutate: createNonce,
    data: nonceData,
    loading: nonceLoading,
    error: nonceError,
  } = useCreateNonce();
  const {
    mutate: connectWallet,
    data: authData,
    loading: authLoading,
    error: authError,
  } = useConnectWallet();

  // Wagmi hook to sign a message
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess(signature) {
        if (address && nonce) {
          console.log("Message signed successfully. Connecting wallet...");
          connectWallet({ address, signature, message: nonce });
        }
      },
      onError(error) {
        console.error("Failed to sign message:", error);
      },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Get nonce when wallet connects
  useEffect(() => {
    if (isConnected && address && !nonce) {
      console.log(
        `Wallet connected with address: ${address}. Creating nonce...`,
      );
      createNonce({ address });
    }
  }, [isConnected, address, createNonce, nonce]);

  // 2. Store nonce and sign message when nonce is received
  useEffect(() => {
    if (nonceData?.nonce) {
      console.log("Nonce received:", nonceData.nonce);
      setNonce(nonceData.nonce);
      console.log("Signing message with nonce...");
      signMessage({ message: nonceData.nonce });
    }
  }, [nonceData, signMessage]);

  // 3. Handle successful authentication
  useEffect(() => {
    if (authData) {
      console.log("Authentication successful:", authData);
      // Here you would typically store the JWT token and user data in a global state (e.g., Zustand, Context)
      // For example: localStorage.setItem('authToken', authData.token);
    }
  }, [authData]);

  // Error handling
  useEffect(() => {
    if (nonceError) {
      console.error("Failed to create nonce:", nonceError);
    }
    if (authError) {
      console.error("Failed to connect wallet:", authError);
    }
  }, [nonceError, authError]);

  if (!mounted) {
    return <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />;
  }

  return <ConnectKitButton />;
}
