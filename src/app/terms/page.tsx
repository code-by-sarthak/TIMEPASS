import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-surface text-foreground">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 prose prose-invert">
        <h1 className="text-3xl font-black text-white mb-6">Terms of Service</h1>
        <p className="text-xs text-gray-400 mb-6">Last updated: October 2026</p>

        <section className="space-y-4 text-xs text-gray-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TIMEPASS, you agree to be bound by these Terms of Service and all applicable local, national, and international laws. If you do not agree to these terms, you must not use the service.
          </p>

          <h2 className="text-base font-bold text-white">2. Age Eligibility (18+ Only)</h2>
          <p>
            You must be at least eighteen (18) years of age to access or use TIMEPASS. By using this service, you warrant and represent that you are at least 18 years old. We reserve the right to request proof of age or utilize automated age-assurance mechanisms where required by law.
          </p>

          <h2 className="text-base font-bold text-white">3. User Conduct and Responsibilities</h2>
          <p>
            You agree not to transmit, display, or broadcast any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, sexually explicit, hateful, or racially or ethnically objectionable. You agree not to attempt to record or rebroadcast peer video without explicit consent.
          </p>

          <h2 className="text-base font-bold text-white">4. Termination and Suspension</h2>
          <p>
            TIMEPASS reserves the right, in its sole discretion, to terminate or suspend your access to all or part of the service, with or without notice, for any conduct that violates these Terms or Community Guidelines.
          </p>

          <h2 className="text-base font-bold text-white">5. Disclaimer of Warranties</h2>
          <p>
            TIMEPASS is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. You interact with strangers at your own risk.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
