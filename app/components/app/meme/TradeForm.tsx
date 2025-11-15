import { useState, useEffect, useMemo } from "react";
import { usePricePerTokenWei } from "@/hooks/contracts/useMemedTokenSale";
import { parseEther, formatEther, parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useMemedTokenBalance } from "@/hooks/contracts/useMemedToken";
import {
  usePaymentTokenBalance,
  usePaymentTokenInfo,
} from "@/hooks/contracts/usePaymentToken";

/**
 * Utility function to format large token amounts with K/M suffixes for better readability
 * @param value - The number value as a string (from formatEther)
 * @returns Formatted string with appropriate precision (e.g., "1.23M", "456.78K", "12.34")
 */
function formatTokenAmount(value: string): string {
  const num = parseFloat(value);

  // Handle zero and very small numbers
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";

  // For millions (1,000,000+)
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }

  // For thousands (1,000+)
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }

  // For smaller numbers, show 2 decimal places
  return num.toFixed(2);
}

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TradeFormProps {
  tokenAddress?: string; // Optional token address - may not exist if token not yet deployed
}

export default function TradeForm({ tokenAddress }: TradeFormProps) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [buyAmount, setBuyAmount] = useState(""); // Amount of payment token to pay
  const [sellAmount, setSellAmount] = useState(""); // Amount of MEME to sell
  const [receiveAmount, setReceiveAmount] = useState("");

  // --- Account and Balance Hooks ---
  const { address: userAddress } = useAccount();

  // Get payment token info (symbol and decimals) - used for buying tokens
  const { symbol: paymentTokenSymbol, decimals: paymentTokenDecimals } =
    usePaymentTokenInfo();

  // Get user's payment token balance for buying tokens (ERC20 token, not native ETH)
  const { data: paymentTokenBalance } = usePaymentTokenBalance();

  // Get user's MEME token balance for selling tokens (only if token deployed)
  const { data: memeTokenBalance } = useMemedTokenBalance(
    tokenAddress as `0x${string}`
  );

  // Debounce the input amounts to avoid excessive hook calls
  const debouncedBuyAmount = useDebounce(buyAmount, 500);
  const debouncedSellAmount = useDebounce(sellAmount, 500);

  // Convert debounced amounts to bigint for the hooks
  // Buy amount: Use payment token decimals (dynamic from contract)
  const buyAmountAsBigInt =
    debouncedBuyAmount && paymentTokenDecimals
      ? parseUnits(debouncedBuyAmount as `${number}`, paymentTokenDecimals)
      : 0n;
  // Sell amount: Use 18 decimals (MEME token standard)
  const sellAmountAsBigInt = debouncedSellAmount
    ? parseEther(debouncedSellAmount as `${number}`)
    : 0n;

  // --- Contract Hooks ---

  // Hook for getting the fixed price per token
  const { data: pricePerTokenWei, isLoading: isLoadingPrice } =
    usePricePerTokenWei();

  // Calculate buy preview: tokens = ethAmount / pricePerTokenWei
  const buyPreviewAmount =
    pricePerTokenWei && buyAmountAsBigInt > 0n
      ? (buyAmountAsBigInt * parseEther("1")) / pricePerTokenWei
      : 0n;

  // Calculate sell preview: eth = tokenAmount * pricePerTokenWei
  const sellPreviewAmount =
    pricePerTokenWei && sellAmountAsBigInt > 0n
      ? (sellAmountAsBigInt * pricePerTokenWei) / parseEther("1")
      : 0n;

  const isLoadingBuyPreview = isLoadingPrice;
  const isLoadingSellPreview = isLoadingPrice;

  // --- Balance Validation ---

  // Check if user has enough payment token to buy (memoized for performance)
  const hasEnoughPaymentTokenBalance = useMemo(() => {
    if (
      !paymentTokenBalance ||
      !buyAmount ||
      parseFloat(buyAmount) <= 0 ||
      !paymentTokenDecimals
    )
      return true; // Don't show error if no input
    const buyAmountBigInt = parseUnits(
      buyAmount as `${number}`,
      paymentTokenDecimals
    );
    return paymentTokenBalance >= buyAmountBigInt;
  }, [paymentTokenBalance, buyAmount, paymentTokenDecimals]);

  // Check if user has enough MEME tokens to sell (memoized for performance)
  const hasEnoughMemeBalance = useMemo(() => {
    if (!memeTokenBalance || !sellAmount || parseFloat(sellAmount) <= 0)
      return true; // Don't show error if no input
    const sellAmountBigInt = parseEther(sellAmount as `${number}`);
    return memeTokenBalance >= sellAmountBigInt;
  }, [memeTokenBalance, sellAmount]);

  // --- Max Button Handlers ---

  // Set buy amount to max payment token balance (no gas buffer needed for ERC20)
  const handleMaxPaymentToken = () => {
    if (!paymentTokenBalance || !paymentTokenDecimals) return;
    // Use full balance - no gas buffer needed since gas is paid in native token, not payment token
    setBuyAmount(formatUnits(paymentTokenBalance, paymentTokenDecimals));
  };

  // Set sell amount to max MEME token balance
  const handleMaxMeme = () => {
    if (!memeTokenBalance) return;
    setSellAmount(formatEther(memeTokenBalance));
  };

  // --- Effects ---

  // Update receive amount when buy preview data changes
  useEffect(() => {
    if (mode === "buy" && buyPreviewAmount && buyPreviewAmount > 0n) {
      setReceiveAmount(formatEther(buyPreviewAmount));
    } else if (mode === "buy" && (!buyAmount || buyAmount === "")) {
      setReceiveAmount("");
    }
  }, [buyPreviewAmount, mode, buyAmount]);

  // Update receive amount when sell preview data changes
  useEffect(() => {
    if (mode === "sell" && sellPreviewAmount && sellPreviewAmount > 0n) {
      setReceiveAmount(formatEther(sellPreviewAmount));
    } else if (mode === "sell" && (!sellAmount || sellAmount === "")) {
      setReceiveAmount("");
    }
  }, [sellPreviewAmount, mode, sellAmount]);

  // Clear amounts when switching modes
  useEffect(() => {
    setBuyAmount("");
    setSellAmount("");
    setReceiveAmount("");
  }, [mode]);

  // --- Handlers ---

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;
    alert("Sell functionality not yet implemented.");
  };

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Buy functionality not yet implemented.");
  };

  // --- Render Logic ---

  // Determine if submit button should be disabled
  const isSubmitDisabled =
    mode === "buy"
      ? !buyAmount ||
        parseFloat(buyAmount) <= 0 ||
        !hasEnoughPaymentTokenBalance
      : !sellAmount || parseFloat(sellAmount) <= 0 || !hasEnoughMemeBalance;

  return (
    <form
      onSubmit={mode === "buy" ? handleBuySubmit : handleSellSubmit}
      className="w-full mx-auto rounded-xl bg-neutral-900 p-4 sm:p-6 text-white space-y-4"
    >
      <h2 className="text-lg font-semibold">Trade MEME</h2>

      <div className="flex bg-neutral-800 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("buy")}
          className={`w-1/2 py-2 font-medium cursor-pointer ${
            mode === "buy" ? "bg-green-700/20 text-green-400" : "text-white"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setMode("sell")}
          className={`w-1/2 py-2 font-medium cursor-pointer ${
            mode === "sell" ? "bg-red-700/20 text-red-400" : "text-white"
          }`}
        >
          Sell
        </button>
      </div>

      {mode === "buy" ? (
        <>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm">
                Pay With {paymentTokenSymbol || "Token"}
              </label>
              {paymentTokenBalance && paymentTokenBalance > 0n && (
                <button
                  type="button"
                  onClick={handleMaxPaymentToken}
                  className="text-xs text-green-400 hover:text-green-300 cursor-pointer font-medium"
                >
                  Max
                </button>
              )}
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg placeholder-neutral-400 text-sm"
            />
            {/* Display user's payment token balance */}
            {paymentTokenBalance !== undefined && paymentTokenDecimals ? (
              <div className="text-xs text-neutral-400 mt-1">
                Your Balance:{" "}
                {formatTokenAmount(
                  formatUnits(paymentTokenBalance, paymentTokenDecimals)
                )}{" "}
                {paymentTokenSymbol || "Token"}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 mt-1">
                Loading balance...
              </div>
            )}
            {/* Warning for insufficient balance */}
            {!hasEnoughPaymentTokenBalance &&
              buyAmount &&
              parseFloat(buyAmount) > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 p-2 rounded-md mt-2">
                  <p className="text-red-400 text-xs">
                    ⚠️ Insufficient {paymentTokenSymbol || "token"} balance
                  </p>
                </div>
              )}
          </div>
          <div className="text-center text-2xl text-neutral-400">↓</div>
          <div>
            <label className="block text-sm mb-1">Receive MEME</label>
            <input
              type="number"
              placeholder={isLoadingBuyPreview ? "Calculating..." : "0.00"}
              value={receiveAmount}
              disabled
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg placeholder-neutral-400 text-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm">Sell MEME</label>
              {memeTokenBalance && memeTokenBalance > 0n && (
                <button
                  type="button"
                  onClick={handleMaxMeme}
                  className="text-xs text-green-400 hover:text-green-300 cursor-pointer font-medium"
                >
                  Max
                </button>
              )}
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg placeholder-neutral-400 text-sm"
            />
            {/* Display user's MEME token balance */}
            {memeTokenBalance !== undefined ? (
              <div className="text-xs text-neutral-400 mt-1">
                Your Balance: {formatTokenAmount(formatEther(memeTokenBalance))}{" "}
                MEME
              </div>
            ) : (
              <div className="text-xs text-neutral-400 mt-1">
                Token not yet deployed
              </div>
            )}
            {/* Warning for insufficient balance */}
            {!hasEnoughMemeBalance &&
              sellAmount &&
              parseFloat(sellAmount) > 0 && (
                <div className="bg-red-500/10 border border-red-500/50 p-2 rounded-md mt-2">
                  <p className="text-red-400 text-xs">
                    ⚠️ Insufficient MEME token balance
                  </p>
                </div>
              )}
          </div>
          <div className="text-center text-2xl text-neutral-400">↓</div>
          <div>
            <label className="block text-sm mb-1">
              Receive {paymentTokenSymbol || "Token"}
            </label>
            <input
              type="number"
              placeholder={isLoadingSellPreview ? "Calculating..." : "0.00"}
              value={receiveAmount}
              disabled
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg placeholder-neutral-400 text-sm"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full py-3 cursor-pointer rounded-lg text-sm font-semibold bg-green-400 text-black hover:bg-green-600 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
      >
        {mode === "buy" ? "Buy MEME" : "Sell MEME"}
      </button>
    </form>
  );
}
