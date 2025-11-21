import { Search, Bell, User, House, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { UserDetail } from "../shared/UserDetail";
import { ClientConnectButton } from "@/components/shared/ClientConnectButton";

interface AppHeaderProps {
  onMenuToggle: () => void;
}

const SearchWithDropdown = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Mock search results - replace with actual data fetching
  const allItems = [
    { id: 1, name: "GLMP", creator: "Oxbruh", marketCap: "$21K" },
    { id: 2, name: "PEPE", creator: "Matt Furie", marketCap: "$5.1B" },
    { id: 3, name: "DOGE", creator: "Billy Markus", marketCap: "$20B" },
    { id: 4, name: "WIF", creator: "memelord", marketCap: "$2.5B" },
  ];

  const filteredItems = searchTerm
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setDropdownOpen(!!term);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      searchContainerRef.current &&
      !searchContainerRef.current.contains(event.target as Node)
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

  return (
    <div ref={searchContainerRef} className="relative hidden md:block">
      <input
        type="search"
        placeholder="Search"
        className="bg-[#1a1a1a] border border-neutral-700 rounded-lg h-11 px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-neutral-500 w-80 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setDropdownOpen(!!searchTerm)}
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

      {isDropdownOpen && filteredItems.length > 0 && (
        <div className="absolute top-full mt-2 w-80 bg-[#1a1a1a] border border-neutral-700 rounded-lg shadow-2xl z-20 overflow-hidden">
          <ul className="divide-y divide-neutral-700">
            {filteredItems.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="px-4 py-3 hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-600 rounded-full"></div>
                  <div>
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-neutral-400 text-xs">
                      Created by{" "}
                      <span className="text-white">{item.creator}</span>
                    </p>
                  </div>
                </div>
                <p className="text-white font-medium">{item.marketCap}</p>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 bg-neutral-800/50">
            <Link
              to={`/explore/search?q=${searchTerm}`}
              className="text-green-500 hover:text-green-400 text-sm font-medium w-full block text-center"
              onClick={() => setDropdownOpen(false)}
            >
              View All Search Results
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const location = useLocation();

  const getTitle = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    const page = parts[1];
    if (page === "app" || !page) {
      return "Explore";
    }
    return "Claim";
  };

  const title = getTitle(location.pathname);
  return (
    <header className="h-full ">
      <div className="flex items-center justify-between h-full">
        {/* Left side - Menu button and Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-green-500 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link
            to="/app"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <House />
          </Link>
          <svg
            className="w-4 h-4 text-gray-600 hidden sm:block"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-gray-400 text-lg ">{title}</span>
        </div>

        {/* Right side - Search, Notifications, User */}
        <div className="flex items-center gap-2 md:gap-4">
          <SearchWithDropdown />

          <button className="text-gray-400 hover:text-white transition-colors border border-neutral-700 p-2  cursor-pointer rounded-lg">
            <Bell className="w-5 h-5" />
          </button>
          {/*user detail*/}
          <ClientConnectButton />

          {/*<button className="md:hidden p-2 text-gray-400 hover:text-white border border-neutral-700 rounded-lg transition-colors">*/}
          {/*  <User className="w-5 h-5" />*/}
          {/*</button>*/}
        </div>
      </div>
    </header>
  );
}
