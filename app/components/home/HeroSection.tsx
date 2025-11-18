import { Link } from "react-router";
import { MoveUpRight } from "lucide-react";
import heroImage from "@/assets/images/heroChecks.svg";
import { useAuthStore } from "@/store/auth";

export function HeroSection() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-4 pt-20"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Your existing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent " />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl  text-white mb-6 leading-tight">
          The meme token economy starts here.
        </h1>

        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Create, share, and battle memes in a social world where engagement has
          real value. Memed.fun lets your memes go viral — and valuable.
        </p>

        <Link
          to={isAuthenticated ? "/explore" : "/about"}
          className="inline-flex items-center px-8 py-4 border border-green-700 bg-black text-white font-bold rounded-full hover:bg-green-700 transition-colors group focus:outline-none focus:ring-4 focus:ring-green-500/50"
        >
          {isAuthenticated ? "Explore Tokens" : "Learn More"}
          <MoveUpRight
            size={15}
            className="ml-2 group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
