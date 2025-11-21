import { useState } from "react";
import { useNavigate } from "react-router";
import { useAccount, useSignMessage } from "wagmi";
import { toast } from "sonner";
import { UserCog, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

export default function CreateUnclaimedToken() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { user } = useAuthStore();
  const { signMessageAsync } = useSignMessage();

  // Check if user is admin
  const isAdmin = user?.role === "ADMIN";

  // Form state
  const [lensHandle, setLensHandle] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [tokenImage, setTokenImage] = useState<string | null>(null);
  const [tokenImageFile, setTokenImageFile] = useState<File | null>(null);

  // Loading and status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!lensHandle.trim()) {
      setError("Lens handle is required");
      return;
    }
    if (!tokenName.trim()) {
      setError("Token name is required");
      return;
    }
    if (!tokenTicker.trim()) {
      setError("Token ticker is required");
      return;
    }
    if (!tokenDescription.trim()) {
      setError("Token description is required");
      return;
    }
    if (!tokenImageFile) {
      setError("Token image is required");
      return;
    }

    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Request nonce
      const nonceResponse = await apiClient.post(API_ENDPOINTS.CREATE_NONCE, {
        address,
      });

      const nonce = nonceResponse.data.nonce;

      // Step 2: Sign the nonce
      const signature = await signMessageAsync({ message: nonce });

      // Step 3: Create FormData with individual fields
      const formData = new FormData();
      formData.append("name", tokenName);
      formData.append("ticker", tokenTicker);
      formData.append("description", tokenDescription);
      // Remove @ symbol if present and send just the username
      formData.append("username", lensHandle.replace(/^@/, ""));
      formData.append("type", "LENS");
      formData.append("image", tokenImageFile);

      // Step 5: Submit to admin endpoint
      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_UNCLAIMED_TOKEN,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Nonce: JSON.stringify({
              message: nonce,
              signature,
            }),
          },
        }
      );

      // Success
      toast.success(
        `Unclaimed token created successfully! Fair Launch ID: ${response.data.fairLaunchId}`
      );

      // Reset form
      setLensHandle("");
      setTokenName("");
      setTokenTicker("");
      setTokenDescription("");
      setTokenImage(null);
      setTokenImageFile(null);

      // Navigate to explore page after short delay
      setTimeout(() => {
        navigate("/explore");
      }, 2000);
    } catch (err: any) {
      console.error("Failed to create unclaimed token:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to create unclaimed token";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-6 rounded-lg max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-sm">
            You don't have permission to access this page. Only admins can
            create unclaimed tokens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-t from-primary-900 to-black rounded-full flex items-center justify-center">
            <UserCog className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Create Unclaimed Token
            </h1>
            <p className="text-gray-400 mt-1">
              Create a token for any Lens handle. The owner can claim it later.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-neutral-800/50 border border-neutral-700 text-neutral-300 p-4 rounded-lg mb-8">
          <h3 className="font-semibold mb-2 text-white">ℹ️ How This Works</h3>
          <ul className="text-sm space-y-1">
            <li>
              • Enter the Lens username you want to create a token for
            </li>
            <li>
              • Backend validates the account exists and has 8000+ followers
            </li>
            <li>
              • Token is created and marked as "unclaimed" in the smart contract
            </li>
            <li>• The Lens account owner can claim ownership later by verifying they own the handle</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
            {/* Lens Handle Input */}
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-300 mb-2">
                Lens Handle *
              </label>
              <input
                type="text"
                placeholder="username or @username"
                value={lensHandle}
                onChange={(e) => setLensHandle(e.target.value)}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the Lens username (with or without @) to create a token for.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column - Token Details */}
              <div className="space-y-6">
                {/* Token Name */}
                <div>
                  <label className="block text-lg font-bold text-gray-300 mb-2">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter token name..."
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Token Ticker */}
                <div>
                  <label className="block text-lg font-bold text-gray-300 mb-2">
                    Token Ticker *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MEME"
                    value={tokenTicker}
                    onChange={(e) =>
                      setTokenTicker(e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Max 5 characters, auto-uppercased
                  </p>
                </div>

                {/* Token Description */}
                <div>
                  <label className="block text-lg font-bold text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Tell the story behind this token..."
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div>
                <label className="block text-lg font-bold text-gray-300 mb-2">
                  Token Image *
                </label>
                <div
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer h-64 bg-neutral-800"
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      setTokenImage(URL.createObjectURL(file));
                      setTokenImageFile(file);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("admin-file-input")?.click()}
                >
                  {tokenImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={tokenImage}
                        alt="Token preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-12 h-12 mb-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <p className="text-center text-gray-400 mb-2">
                        Drag and drop your token image here
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                  <input
                    id="admin-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setTokenImage(URL.createObjectURL(file));
                        setTokenImageFile(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !address}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Token...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Create Unclaimed Token
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
