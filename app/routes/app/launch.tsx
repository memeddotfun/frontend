import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";

import ConnectProfile from "../../components/app/launch/ConnectProfile";
import CreateMemeForm from "@/components/app/launch/CreateMemeForm";
import TokenSettingForm from "../../components/app/launch/TokenSettingForm";
import { useCreateMemeToken } from "@/hooks/api/useMemedApi";
import { Share2Icon } from "lucide-react";
import { Link } from "react-router";
import { useCreateNonce } from "@/hooks/api/useAuth";

export default function LaunchPage() {
  const { address } = useAccount();
  const {
    mutate: createToken,
    loading: isMinting,
    error,
    data: createdToken,
  } = useCreateMemeToken();
  const { mutate: createNonce } = useCreateNonce();
  const { signMessageAsync } = useSignMessage();

  const [memeImage, setMemeImage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [memeTitle, setMemeTitle] = useState<string>("");
  const [memeDescription, setMemeDescription] = useState<string>("");
  const [memeSymbol, setMemeSymbol] = useState<string>("");

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

    try {
      // 1. Get nonce
      const nonceResponse = await createNonce({ address });
      if (!nonceResponse?.nonce) {
        throw new Error("Failed to retrieve nonce for signing.");
      }
      const message = nonceResponse.nonce;

      // 2. Sign the nonce to get a signature
      const signature = await signMessageAsync({ message });

      // 3. Prepare form data
      const response = await fetch(memeImage);
      const blob = await response.blob();
      const imageFile = new File([blob], "meme-image.png", { type: blob.type });

      const textData = {
        name: memeTitle,
        ticker: memeSymbol,
        description: memeDescription,
        message,
        signature,
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(textData));
      formData.append("image", imageFile);

      // 4. Call the create token endpoint
      await createToken(formData);
    } catch (e) {
      console.error("Minting error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      toast.error(errorMessage);
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
      toast.error(
        error.message || "Failed to mint meme coins. Please try again.",
      );
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
