import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useFairLaunchData,
  useFairLaunchDuration,
} from "@/hooks/contracts/useMemedTokenSale";

interface CountdownTimerProps {
  tokenId: bigint;
}

/**
 * CountdownTimer Component
 *
 * Displays real-time countdown until fair launch window closes.
 * Uses actual start time from contract + duration to calculate end time.
 * Updates every second for accurate countdown display.
 */
const CountdownTimer = ({ tokenId }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("--");
  const [isExpired, setIsExpired] = useState(false);

  // Get fair launch data and duration from contract
  const { data: fairLaunchData } = useFairLaunchData(tokenId);
  const { data: duration } = useFairLaunchDuration();

  // Extract start time from fairLaunchData
  // fairLaunchData[1] = fairLaunchStartTime (Unix timestamp in seconds)
  const startTime = fairLaunchData ? fairLaunchData[1] : 0n;

  // Real-time countdown effect - updates every second
  useEffect(() => {
    // Wait until we have valid data from contract
    if (!startTime || !duration || startTime === 0n) {
      setTimeRemaining("--");
      return;
    }

    const updateCountdown = () => {
      const now = BigInt(Math.floor(Date.now() / 1000)); // Current time in seconds (Unix timestamp)
      const endTime = startTime + duration; // End time = start time + duration
      const remaining = endTime - now;

      // Check if countdown has expired
      if (remaining <= 0n) {
        setIsExpired(true);
        setTimeRemaining("Ended");
        return;
      }

      setIsExpired(false);

      // Convert remaining seconds to days, hours, minutes, seconds
      const days = remaining / 86400n; // 86400 seconds in a day
      const hours = (remaining % 86400n) / 3600n; // 3600 seconds in an hour
      const minutes = (remaining % 3600n) / 60n; // 60 seconds in a minute
      const seconds = remaining % 60n;

      // Format as "Xd Xh Xm Xs"
      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    // Update immediately on mount/data change
    updateCountdown();

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [startTime, duration]);

  return (
    <div className="bg-neutral-900 p-6 rounded-xl text-center">
      <h2 className="text-white text-lg font-semibold mb-2 flex gap-2 items-center justify-center">
        <Clock className={isExpired ? "text-red-500" : "text-orange-500"} />
        Time Remaining
      </h2>
      <div
        className={`text-3xl font-bold mb-1 ${
          isExpired ? "text-red-500" : "text-white"
        }`}
      >
        {timeRemaining}
      </div>
      <p className="text-neutral-400 text-sm">
        {isExpired ? "Launch window has closed" : "Until launch window closes"}
      </p>
    </div>
  );
};

export default CountdownTimer;
