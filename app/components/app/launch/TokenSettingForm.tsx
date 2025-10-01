import React, { useState } from "react";

import { toast } from "sonner";

export default function TokenSettingForm({
  handlePrevStep,
  handleMint,
  isMinting,
  memeImage,
  memeSymbol,
  setMemeSymbol,
  memeTitle,
  setMemeTitle,
  memeDescription,
}: {
  handlePrevStep: () => void;
  handleMint: () => void;
  isMinting: boolean;
  memeImage: string | null;
  memeSymbol: string;
  setMemeSymbol: (symbol: string) => void;
  memeTitle: string;
  setMemeTitle: (title: string) => void;
  memeDescription: string;
}) {
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isSymbolDialogOpen, setIsSymbolDialogOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(memeTitle);
  const [tempSymbol, setTempSymbol] = useState(memeSymbol);
  const [hasReviewed, setHasReviewed] = useState(false);

  const handleSaveTitle = () => {
    setMemeTitle(tempTitle);
    setIsNameDialogOpen(false);
  };

  const handleSaveSymbol = () => {
    setMemeSymbol(tempSymbol);
    setIsSymbolDialogOpen(false);
  };

  return (
    <div className="p-8 bg-neutral-900 rounded-xl border border-neutral-800  max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-3xl md:text-3xl font-black text-white">
          Ready to Launch
        </h3>
        <div className="flex items-center gap-3">
          <span className=" text-white px-3 py-1 rounded-lg font-medium">
            Preview
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        {/* Left Column - Image */}
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-md px-2">
            <div className="relative w-full aspect-square">
              {memeImage && (
                <img
                  src={memeImage}
                  alt="Uploaded meme"
                  className="object-contain w-full h-full"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center p-3 bg-gradient-to-r from-green-400 to-primary rounded-lg border border-neutral-800">
            <div className="flex items-center mr-4">
              <div className="mr-2 w-3 h-3 bg-neutral-900 rounded-full animate-pulse"></div>
              <span className="font-bold text-xs uppercase text-white">
                Ready
              </span>
            </div>
            <div className="text-sm font-medium text-white">
              All systems are go for launch!
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Token Overview
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="token-name"
                  className="text-sm text-gray-400 font-medium block"
                >
                  TOKEN NAME
                </label>
                <div className="flex items-center">
                  <div className="text-xl font-bold text-white">
                    {memeTitle || "Untitled Token"}
                  </div>
                  <button
                    className="ml-2 h-6 w-6 rounded-full p-0 hover:bg-neutral-700 text-gray-400"
                    onClick={() => {
                      setTempTitle(memeTitle);
                      setIsNameDialogOpen(true);
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>

              <div className="py-4 border-t border-neutral-700">
                <label className="text-sm text-gray-400 font-medium block">
                  TOKEN SYMBOL
                </label>
                <div className="flex items-center">
                  <div className="text-xl font-bold text-white">
                    {memeSymbol || "---"}
                  </div>
                  <button
                    className="ml-2 h-6 w-6 rounded-full p-0 hover:bg-neutral-700 text-gray-400"
                    onClick={() => {
                      setTempSymbol(memeSymbol);
                      setIsSymbolDialogOpen(true);
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>

              <div className="py-4 border-t border-neutral-700">
                <label className="text-sm text-gray-400 font-medium block">
                  DESCRIPTION
                </label>
                <div className="text-white text-sm mt-1">
                  {memeDescription || "No description provided."}
                </div>
              </div>

              <div className="py-4 border-t border-neutral-700">
                <label className="text-sm text-gray-400 font-medium block">
                  INITIAL SUPPLY
                </label>
                <div className="text-xl font-bold text-white">
                  1,000,000,000 Tokens
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700">
            <div className="flex items-start space-x-4">
              <div className="mt-1 p-2 bg-green-100 rounded-full">💰</div>
              <div>
                <h3 className="text-lg font-bold mb-2 text-white">
                  Token Economics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 bg-primary rounded-full mr-2"></div>
                    <p className="text-gray-400 text-sm">
                      <span className="font-medium text-white">Trading:</span>{" "}
                      Your token will be tradable on decentralized exchanges.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 bg-primary rounded-full mr-2"></div>
                    <p className="text-gray-400 text-sm">
                      <span className="font-medium text-white">
                        Engagement rewards:
                      </span>{" "}
                      2% of supply will be distributed to users who interact
                      with your meme.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 mt-1.5 bg-primary rounded-full mr-2"></div>
                    <p className="text-gray-400 text-sm">
                      <span className="font-medium text-white">Network:</span>{" "}
                      Your token will be deployed on the Lens network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with action buttons */}
      <div className="mt-10 pt-6 border-t border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={handlePrevStep}
          className="w-full sm:w-auto border border-neutral-700 text-white p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 cursor-pointer px-6"
        >
          &larr; Back
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 mr-2 accent-primary"
              checked={hasReviewed}
              onChange={() => setHasReviewed(!hasReviewed)}
            />
            <span className="text-sm font-medium text-gray-400">
              I have reviewed all details
            </span>
          </label>
          <button
            onClick={handleMint}
            className="w-full sm:w-auto bg-green-600 p-2  text-white hover:bg-primary-dark cursor-pointer px-8 border border-neutral-800  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            disabled={isMinting || !hasReviewed || !memeTitle || !memeSymbol}
          >
            {isMinting ? <>Launching...</> : <>🚀 Launch Token</>}
          </button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      {isNameDialogOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-8 border border-neutral-700 shadow-lg rounded-md bg-neutral-900 max-w-md mx-auto text-white">
            <h3 className="text-xl font-bold mb-4">Edit Token Name</h3>
            <p className="text-gray-400 mb-4">
              This will be the official name of your token on-chain.
            </p>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300"
              >
                Token Name
              </label>
              <input
                id="name"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="e.g., DogeCoin"
                className="mt-1 block w-full p-2 border border-neutral-700 bg-neutral-800 rounded-md text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Choose a memorable name that reflects your meme.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-neutral-700 rounded-md hover:bg-neutral-700 text-white"
                onClick={() => setIsNameDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                onClick={handleSaveTitle}
                disabled={!tempTitle.trim()}
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Symbol Dialog */}
      {isSymbolDialogOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-8 border border-neutral-700 shadow-lg rounded-md bg-neutral-900 max-w-md mx-auto text-white">
            <h3 className="text-xl font-bold mb-4">Edit Token Symbol</h3>
            <p className="text-gray-400 mb-4">
              This will be the ticker symbol for your token on exchanges.
            </p>
            <div className="mb-4">
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-300"
              >
                Token Symbol
              </label>
              <input
                id="symbol"
                value={tempSymbol}
                onChange={(e) => setTempSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., DOGE"
                className="mt-1 block w-full p-2 border border-neutral-700 bg-neutral-800 rounded-md text-white"
                maxLength={5}
              />
              <p className="text-xs text-gray-400 mt-1">
                Typically 3-5 characters, all caps. (e.g., BTC, ETH, DOGE)
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-neutral-700 rounded-md hover:bg-neutral-700 text-white"
                onClick={() => setIsSymbolDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                onClick={handleSaveSymbol}
                disabled={!tempSymbol.trim()}
              >
                Save Symbol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
