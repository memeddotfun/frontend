import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { ClientConnectButton } from "../shared/ClientConnectButton";
import { useAuthStore } from "@/store/auth";
import logo from "@/assets/images/logo.png";

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const { isAuthenticated } = useAuthStore();

  // Filter navigation items based on authentication
  const navItems = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    ...(isAuthenticated ? [{ label: "Explore", href: "/explore" }] : []),
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-green-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center justify-between  w-full md:w-auto">
            <Link to="/" className="flex items-center space-x-2 ml-2 md:ml-0">
              <img
                src={logo}
                alt={"Memed.fun"}
                className="w-[35px] object-cover"
              />
              <span className="text-white font-bold text-lg">Memed</span>
            </Link>

            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 text-green-500 hover:text-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black rounded"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-gray-300 hover:text-green-500 hover:border-b border-green-500 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black rounded-sm px-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <ClientConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
