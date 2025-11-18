import { Link } from "react-router";
import { MoveUpRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import footerImage from "@/assets/images/footerboxes.svg";

export function CTASection() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section
      className="py-20 px-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${footerImage})` }}
    >
      {/* Your existing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-green-500/20 " />

      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl  text-white mb-6">
            Ready to turn your memes
            <br />
            into real rewards ?
          </h2>

          <p className="text-lg text-gray-300 mb-8">
            Join the Web3 meme economy where every like, share, and comment
            earns you meme tokens. Stake, battle, and go viral — all on-chain.
          </p>

          <Link
            to={isAuthenticated ? "/explore" : "/about"}
            className="inline-flex items-center px-8 py-4 bg-black text-white border border-green-700 rounded-full hover:bg-green-700 transition-colors group focus:outline-none focus:ring-4 focus:ring-green-500/50"
          >
            {isAuthenticated ? "Explore Tokens" : "Learn More"}
            <MoveUpRight
              size={15}
              className="ml-2 group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
