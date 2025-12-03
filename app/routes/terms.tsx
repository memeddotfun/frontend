import { useState } from "react";
import { Header } from "@/components/home/Header";
import { MobileMenu } from "@/components/home/MobileMenu";
import { Footer } from "@/components/home/Footer";

export default function Terms() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-500">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            <strong>Last updated:</strong> 01/12/2025<br />
            <strong>Effective date:</strong> 01/12/2025
          </p>

          <p className="text-gray-300 mb-6">
            Welcome to Memed.fun. These Terms of Service ("Terms") govern your use of our website, services, and features. By accessing or using Memed.fun, you agree to be bound by these Terms.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-300 mb-6">
            By using Memed.fun, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">2. Description of Service</h2>
          <p className="text-gray-300 mb-6">
            Memed.fun is a platform for creating, sharing, and engaging with meme-based tokens and content. Our services include token creation, battles, rewards, and community features.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">3. User Responsibilities</h2>
          <p className="text-gray-300 mb-4">You agree to:</p>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>Provide accurate and complete information when creating an account</li>
            <li>Use the platform in compliance with applicable laws and regulations</li>
            <li>Respect other users and maintain appropriate conduct</li>
            <li>Not engage in fraudulent, deceptive, or harmful activities</li>
            <li>Protect your account credentials and notify us of any unauthorized access</li>
          </ul>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">4. Content and Intellectual Property</h2>
          <p className="text-gray-300 mb-6">
            You retain ownership of content you create on Memed.fun. By posting content, you grant us a license to use, display, and distribute your content on our platform. You are responsible for ensuring you have the right to share any content you post.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">5. Prohibited Activities</h2>
          <p className="text-gray-300 mb-4">You may not:</p>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Post harmful, offensive, or inappropriate content</li>
            <li>Attempt to hack, disrupt, or interfere with our services</li>
            <li>Use automated tools or bots without permission</li>
            <li>Engage in market manipulation or fraudulent activities</li>
          </ul>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">6. Termination</h2>
          <p className="text-gray-300 mb-6">
            We reserve the right to suspend or terminate your account and access to our services at any time for violations of these Terms or for other reasons we deem necessary.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">7. Disclaimers and Limitations</h2>
          <p className="text-gray-300 mb-6">
            Our services are provided "as is" without warranties. We do not guarantee uninterrupted service or the accuracy of information. You use our platform at your own risk.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">8. Changes to Terms</h2>
          <p className="text-gray-300 mb-6">
            We may update these Terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">9. Contact Information</h2>
          <p className="text-gray-300">
            If you have questions about these Terms, please contact us at <a href="mailto:support@memed.fun" className="text-green-400 hover:text-green-300">support@memed.fun</a>
          </p>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}