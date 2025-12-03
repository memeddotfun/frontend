import { Link } from "react-router";
import logo from "@/assets/images/logo.png";
import { CiFacebook } from "react-icons/ci";
import { AiOutlineDiscord } from "react-icons/ai";
import { LiaTelegramPlane } from "react-icons/lia";
import { PiGithubLogo } from "react-icons/pi";
import { PiInstagramLogo } from "react-icons/pi";
import { FaXTwitter } from "react-icons/fa6";

export function Footer() {
  const navigation = [
    { label: "About", href: "/about" },
    { label: "Explore", href: "/explore" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    // { label: "Launch App", href: "/app" },
  ];

  return (
    <footer className="border-green-500/20 bg-black/80 backdrop-blur-sm mt-10">
      <div className="mx-auto px-4 md:px-8 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img
                src={logo}
                alt={"Memed.fun"}
                className="w-[35px] h-[35px] object-contain"
              />
              <span className="text-white font-bold text-lg">Memed</span>
            </Link>
          </div>

          <nav className="flex flex-wrap justify-center md:justify-start gap-6">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-gray-400 hover:text-green-500 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex justify-center md:justify-end items-center space-x-4">
            <a
              href="https://t.me/memeddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Telegram"
            >
              <LiaTelegramPlane size={24} />
            </a>
            <a
              href="https://github.com/memeddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Github"
            >
              <PiGithubLogo size={24} />
            </a>
            <a
              href="https://instagram.com/memeddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Instagram"
            >
              <PiInstagramLogo size={24} />
            </a>
            <a
              href="https://facebook.com/memeddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Facebook"
            >
              <CiFacebook size={24} />
            </a>
            <a
              href="https://x.com/memeddotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Twitter"
            >
              <FaXTwitter size={22} />
            </a>
            <a
              href="https://discord.gg/b9PfQwCsdG"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-label="Discord"
            >
              <AiOutlineDiscord size={26} />
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto px-4 md:px-8 lg:px-20 py-3 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-sm text-gray-400 text-center md:text-left" suppressHydrationWarning>
              © {new Date().getFullYear()} Memed.fun. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
