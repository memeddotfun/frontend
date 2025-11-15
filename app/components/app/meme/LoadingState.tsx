/**
 * LoadingState Component
 *
 * Displays a simple spinner while fair launch data is being fetched.
 * Prevents showing wrong phase components before data arrives.
 */

export default function LoadingState() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      {/* Simple spinner - no text */}
      <div className="w-12 h-12 border-4 border-neutral-700 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );
}
