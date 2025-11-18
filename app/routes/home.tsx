import { useState } from "react";
import type { Route } from "./+types/home";
import { Header } from "@/components/home/Header";
import { MobileMenu } from "@/components/home/MobileMenu";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { TrendingMemes } from "@/components/home/TrendingMemes";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memed.fun - Turn Your Memes Into Tokens" },
    {
      name: "description",
      content:
        "Web3 meme token platform with bonding curve pricing, staking rewards, and battle mechanics. Create, stake, and battle with your meme tokens.",
    },
    {
      name: "keywords",
      content:
        "meme tokens, bonding curve, staking, web3, defi, memes, social tokens",
    },
    {
      property: "og:title",
      content: "Memed.fun - Turn Your Memes Into Tokens",
    },
    {
      property: "og:description",
      content:
        "Web3 meme token platform with bonding curve pricing, staking rewards, and battle mechanics.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://memed.fun" },
  ];
}

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Header
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main>
        <HeroSection />
        {/*<StatsSection />*/}
        <TrendingMemes />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
