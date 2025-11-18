import { Link } from "react-router";
import { X, MessageCircle, Twitter } from "lucide-react";
import { ClientConnectButton } from "../shared/ClientConnectButton";
import { useAuthStore } from "@/store/auth";
import logo from "@/assets/images/logo.png";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { isAuthenticated } = useAuthStore();

  // Filter navigation items based on authentication
  const navItems = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    ...(isAuthenticated ? [{ label: "Explore", href: "/explore" }] : []),
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-black border-r border-green-500/20 z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-green-500/20">
            <div className="flex items-center space-x-2">
              <img
                src={logo}
                alt={"Memed.fun"}
                className="w-[35px] object-cover"
              />
              <span className="text-white font-bold text-lg">Memed</span>
            </div>
            {/*<button*/}
            {/*  onClick={onClose}*/}
            {/*  className="p-2 text-gray-400 hover:text-white transition-colors"*/}
            {/*  aria-label="Close menu"*/}
            {/*>*/}
            {/*  <X size={24} />*/}
            {/*</button>*/}
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="block py-2 text-gray-300 hover:text-green-500 hover:border-b border-green-500 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black rounded px-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <ClientConnectButton />
            </div>
          </nav>

          <div className="p-4 border-t border-green-500/20">
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://twitter.com/memed"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-label="Twitter"
              >
                <svg
                  className="w-5 h-5 fill-current"
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
              </a>
              <a
                href="https://t.me/memed"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-label="Telegram"
              >
                <MessageCircle size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
