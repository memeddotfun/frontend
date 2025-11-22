import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";

import ConnectProfile from "../../components/app/launch/ConnectProfile";
import CreateMemeForm from "@/components/app/launch/CreateMemeForm";
import TokenSettingForm from "../../components/app/launch/TokenSettingForm";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { Share2Icon } from "lucide-react";
import { Link } from "react-router";
import { useCreateNonce } from "@/hooks/api/useAuth";
import { useIsMintable } from "@/hooks/contracts/useMemedTokenSale";
import { ConnectWalletPrompt } from "@/components/shared/ConnectWalletPrompt";
import { useAuthStore } from "@/store/auth";

export default function LaunchPage() {
  const { address } = useAccount();
  const { mutate: createNonce } = useCreateNonce();
  const { signMessageAsync } = useSignMessage();
  const { isAuthenticated } = useAuthStore();

  // Check if user is allowed to mint/launch tokens
  const { data: isMintable, isLoading: isMintableLoading } = useIsMintable(address);

  // State for the multi-step form
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // State for meme data
  const [memeImage, setMemeImage] = useState<string | null>(null);
  const [memeTitle, setMemeTitle] = useState<string>("");
  const [memeDescription, setMemeDescription] = useState<string>("");
  const [memeSymbol, setMemeSymbol] = useState<string>("");

  // Manual state for minting process
  const [isSigning, setIsSigning] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [createdToken, setCreatedToken] = useState<any | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!memeTitle || !memeSymbol || !memeDescription || !memeImage) {
      toast.error("Please fill out all fields and upload an image.");
      return;
    }
    // Final eligibility check as a safety measure
    if (isMintable === false) {
      toast.error("Your wallet is not eligible to launch tokens.");
      return;
    }

    try {
      // 1. Set signing state
      setIsSigning(true);
      const nonceResponse = await createNonce({ address });
      if (!nonceResponse?.nonce) {
        throw new Error("Failed to retrieve nonce for signing.");
      }
      const nonce = nonceResponse.nonce;

      // 2. Sign the nonce to get a signature
      const signature = await signMessageAsync({ message: nonce });
      setIsSigning(false);

      // 3. Set minting state
      setIsMinting(true);

      // 4. Prepare form data and headers
      const response = await fetch(memeImage);
      const blob = await response.blob();
      const imageFile = new File([blob], "meme-image.png", { type: blob.type });

      const textData = {
        name: memeTitle,
        ticker: memeSymbol,
        description: memeDescription,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(textData));
      formData.append("image", imageFile);

      const headers = {
        Nonce: JSON.stringify({ message: nonce, signature }),
      };

      // 5. Call the API directly using apiClient
      const result = await apiClient.post(
        API_ENDPOINTS.CREATE_TOKEN,
        formData,
        { headers }, // 60s timeout, no retries
      );

      setCreatedToken(result.data);
    } catch (e) {
      const error = e as Error;
      setError(error);
      console.error("Minting error:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSigning(false);
      setIsMinting(false);
    }
  };

  // Handle successful token creation
  useEffect(() => {
    if (createdToken) {
      console.log("Token created successfully:", createdToken);
      setShowSuccess(true);
    }
  }, [createdToken]);

  // Handle error during token creation
  useEffect(() => {
    if (error) {
      console.error("Minting error:", error);
      // Toast is already shown in handleMint, but you could add more handling here
    }
  }, [error]);

  if (showSuccess) {
    return (
      <>
        <div className="min-h-screen ">
          <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20"
          />
          <div className="container px-4 py-12 mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-8 text-3xl text-white bg-green-600 rounded-full">
                ✨
              </div>
              <h1 className="mb-6 text-5xl font-black ">Meme Created!</h1>
              <p className="mb-8 text-xl text-neutral-600">
                Your meme has been successfully tokenized and is now live on the
                Lens chain.
              </p>

              <div className="p-8 mb-8 bg-neutral-900 ">
                <div className="relative w-64 h-64 mx-auto mb-6">
                  {memeImage && (
                    <img
                      src={memeImage}
                      alt="Your meme"
                      className="object-contain w-full h-full"
                    />
                  )}
                </div>
                <h2 className="mb-2 text-2xl font-bold">{memeTitle} Token</h2>
                <p className="mb-4 text-white">
                  ${memeSymbol} • 1,000,000,000 supply
                </p>
                <div className="flex justify-center  gap-4">
                  <Link to={`/explore`}>
                    <button className="px-4  gap-2 bg-green-700   border-green-700 text-black  items-center flex  rounded-md h-10  hover:shadow-2xl cursor-pointer">
                      <Share2Icon size={12} /> Share
                    </button>
                  </Link>{" "}
                  <Link to={`/explore`}>
                    <button className="px-4  gap-2 border-2 border-neutral-800 rounded-md h-10 text-white  hover:shadow-2xl cursor-pointer">
                      View on Explorer
                    </button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link to="/launch">
                  <button
                    className="px-4 py-2 w-full gap-2 cursor-pointer hover:shadow-2xl border-2 border-neutral-800 text-white rounded-md sm:w-auto"
                    onClick={() => {
                      setShowSuccess(false);
                      setStep(1);
                      setMemeImage(null);
                    }}
                  >
                    Create Another Meme
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Gate: Require wallet connection to launch tokens
  if (!isAuthenticated || !address) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="container px-4 py-12 mx-auto">
          <div className="max-w-2xl mx-auto">
            <ConnectWalletPrompt
              variant="card"
              message="Connect your wallet to launch your own meme token"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* <Header /> */}
      <div className="min-h-screen flex justify-center items-center">
        <div className="container relative z-10 px-4 py-12 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Step Content */}
            <div>
              {step === 1 && (
                <ConnectProfile
                  setStep={setStep}
                  selectedAccount={null} // Dummy data removed
                  isMintable={isMintable}
                  isMintableLoading={isMintableLoading}
                />
              )}
              {step === 2 && (
                <CreateMemeForm
                  memeImage={memeImage}
                  setMemeImage={setMemeImage}
                  handlePrevStep={handlePrevStep}
                  handleNextStep={handleNextStep}
                  memeTitle={memeTitle}
                  setMemeTitle={setMemeTitle}
                  memeDescription={memeDescription}
                  setMemeDescription={setMemeDescription}
                  memeSymbol={memeSymbol}
                  setMemeSymbol={setMemeSymbol}
                />
              )}
              {step === 3 && (
                <TokenSettingForm
                  handlePrevStep={handlePrevStep}
                  handleMint={handleMint}
                  isSigning={isSigning}
                  isMinting={isMinting}
                  memeImage={memeImage}
                  memeSymbol={memeSymbol}
                  setMemeSymbol={setMemeSymbol}
                  memeTitle={memeTitle}
                  setMemeTitle={setMemeTitle}
                  memeDescription={memeDescription}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
}
