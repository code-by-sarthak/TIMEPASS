import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 prose prose-invert">
        <h1 className="text-3xl font-black text-white mb-6">Privacy Policy & Peer-to-Peer Encryption</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: October 2026</p>

        <section className="space-y-4 text-xs text-gray-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">1. Core Privacy Architecture: Encrypted P2P</h2>
          <p>
            TIMEPASS uses WebRTC (Web Real-Time Communication) to establish direct peer-to-peer audio and video streams between matched users. Your camera video and microphone audio stream directly between your device and your chat partner&apos;s device using standard DTLS-SRTP encryption.
          </p>
          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 font-semibold">
            We do not record, tap, process, or store video or audio streams on our servers.
          </div>

          <h2 className="text-base font-bold text-white">2. Information We Collect</h2>
          <p>
            We adhere to strict data minimization principles:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> If you register, we store your chosen username, display name, hashed passwords (via bcrypt), and optional preferences (interests, language).</li>
            <li><strong>Guest Mode:</strong> If you use guest mode, we create a temporary random identifier and do not require personal identification.</li>
            <li><strong>Safety & Moderation Data:</strong> When a user reports abuse, we preserve the report timestamp, reason, and reported user ID for review by moderators.</li>
          </ul>

          <h2 className="text-base font-bold text-white">3. Information We Never Share</h2>
          <p>
            We never sell, rent, or trade your personal data. We never expose your IP address, phone number, email address, or precise geographic location to other chat participants.
          </p>

          <h2 className="text-base font-bold text-white">4. Data Deletion (GDPR & CCPA)</h2>
          <p>
            You have the right to delete your profile, block lists, and account at any time. Simply click &quot;Delete Account&quot; on your Profile settings page, which immediately and permanently purges your data from our database.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
