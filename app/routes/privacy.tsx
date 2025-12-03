import { useState } from "react";
import { Header } from "@/components/home/Header";
import { MobileMenu } from "@/components/home/MobileMenu";
import { Footer } from "@/components/home/Footer";

export default function Privacy() {
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
          Privacy Policy
        </h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            <strong>Last updated:</strong> 01/12/2025<br />
            <strong>Effective date:</strong> 01/12/2025<br />
            <strong>Contact:</strong> support@memed.fun
          </p>

          <p className="text-gray-300 mb-6">
            Welcome to Memed.fun ("we", "us", "our"). This Privacy Policy explains how we collect, use, share, and protect your personal data when you use our website, services, and features — including any integration with Facebook / Meta products (e.g., Facebook/Instagram Login, APIs, plugins).
          </p>

          <p className="text-gray-300 mb-8">
            By using Memed.fun, you agree to the collection and use of information in accordance with this policy.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">1. What Data We Collect</h2>
          <p className="text-gray-300 mb-4">We collect the following categories of information:</p>

          <h3 className="text-xl font-medium text-green-300 mb-2">a. Information You Provide Directly</h3>
          <ul className="text-gray-300 mb-4 list-disc list-inside">
            <li>Account details: email, username, profile info when you sign up.</li>
            <li>User content: memes, uploads, comments, votes, messages.</li>
            <li>Support communication: emails you send to us.</li>
          </ul>

          <h3 className="text-xl font-medium text-green-300 mb-2">b. Automatically Collected Information</h3>
          <ul className="text-gray-300 mb-4 list-disc list-inside">
            <li>Usage data: pages visited, time spent, interaction events.</li>
            <li>Device & log data: IP address, device type, browser type, timestamps.</li>
            <li>Cookies and tracking technologies used for analytics and personalization.</li>
          </ul>

          <h3 className="text-xl font-medium text-green-300 mb-2">c. Facebook / Meta Data (if you use Facebook Login or features)</h3>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>Public profile (name, profile picture, email if granted).</li>
            <li>User ID & token necessary to authenticate your Facebook connection.</li>
          </ul>
          <p className="text-gray-300 mb-6">
            We only collect Facebook data you choose to share and only for the purpose of providing features you've requested. We do not collect your Facebook password. We do not access additional Facebook data without explicit consent. (iubenda.com)
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">2. How We Use Your Data</h2>
          <p className="text-gray-300 mb-4">We use your personal data to:</p>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>Create and manage your account.</li>
            <li>Deliver and improve features (memes, battles, notifications).</li>
            <li>Personalize your experience.</li>
            <li>Communicate updates, security alerts.</li>
            <li>Analyze trends and usage to improve our service.</li>
            <li>Comply with legal obligations and protect safety and rights.</li>
          </ul>
          <p className="text-gray-300 mb-6">
            If you connect your Facebook account, we use that data strictly for login and profile population purposes unless you grant additional permissions. (Facebook for Developers)
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">3. How Your Data Is Shared</h2>
          <p className="text-gray-300 mb-4">We may share your information:</p>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>With service providers that help run our site (hosting, analytics).</li>
            <li>With Meta / Facebook, only as required by their platform integrations and with your explicit consent.</li>
            <li>For legal reasons, to comply with law or protect rights.</li>
            <li>Aggregated or anonymized data that cannot reasonably identify you.</li>
          </ul>
          <p className="text-gray-300 mb-6">
            We do not sell your personal data to third parties. (Termly)
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">4. Your Choices & Rights</h2>
          <p className="text-gray-300 mb-4">You can:</p>
          <ul className="text-gray-300 mb-6 list-disc list-inside">
            <li>Opt out of cookies via your browser settings.</li>
            <li>Update or delete account information from your profile page or by contacting us.</li>
            <li>Revoke Facebook access through your Facebook account settings.</li>
            <li>Request removal of your data: Email support@memed.fun. We will respond within a reasonable timeframe.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">5. Data Retention</h2>
          <p className="text-gray-300 mb-6">
            We retain personal data as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our policies. If you delete your account, we remove personally identifiable data unless we need to retain it for legitimate business or legal reasons.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">6. Security</h2>
          <p className="text-gray-300 mb-6">
            We implement commercially reasonable measures to protect your data. But no system is perfect — we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">7. Changes to This Policy</h2>
          <p className="text-gray-300 mb-6">
            We may update this Privacy Policy. We will post changes here with a revised "Last updated" date. Continued use after updates means you accept the new terms.
          </p>

          <h2 className="text-2xl font-semibold text-green-400 mb-4">8. Contact Us</h2>
          <p className="text-gray-300">
            If you have questions or concerns about this policy or your data, email: <a href="mailto:support@memed.fun" className="text-green-400 hover:text-green-300">support@memed.fun</a>
          </p>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}