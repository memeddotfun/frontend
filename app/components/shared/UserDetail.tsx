import { User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface UserDetailProps {
  onDisconnect: () => void;
  isDisconnecting: boolean;
}

export function UserDetail({ onDisconnect, isDisconnecting }: UserDetailProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isDisconnecting) {
      setDropdownOpen(!isDropdownOpen);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when disconnect starts
  useEffect(() => {
    if (isDisconnecting) {
      setDropdownOpen(false);
    }
  }, [isDisconnecting]);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={toggleDropdown}
        className={`hidden md:flex items-center gap-3 h-11 bg-[#1a1a1a] border border-neutral-700 rounded-lg px-3 py-2 transition-colors shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] ${
          isDisconnecting ? "cursor-wait opacity-70" : "cursor-pointer"
        }`}
      >
        <div className="w-8 h-8 bg-stone-600 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white text-sm font-medium">John Doe</div>
          <div className="text-gray-400 text-xs"> @johndoe</div>
        </div>
        {isDisconnecting ? (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {isDropdownOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#1a1a1a] border border-neutral-700 rounded-lg shadow-2xl z-20 overflow-hidden">
          <ul>
            <li>
              <button
                onClick={onDisconnect}
                className="w-full text-left px-4 py-3 text-red-500 hover:bg-neutral-700/50 transition-colors"
              >
                Disconnect
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
