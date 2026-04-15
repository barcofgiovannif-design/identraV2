import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: April 15, 2026</p>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              We collect information you provide directly to us, such as your name, company name, email address, and payment information when you register for an account or make a purchase. We also collect information automatically when you use our services, including log data, device information, and usage data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage and trends</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Sharing of Information</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform (such as payment processors like Stripe), provided those parties agree to keep this information confidential. We may also disclose your information if required by law or to protect the rights, property, or safety of Identra, our users, or others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or method of electronic storage is 100% secure. Your data is stored on secure servers and we use industry-standard encryption for data in transit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Digital Business Card Data</h2>
            <p className="text-gray-600 leading-relaxed">
              Digital business card profiles created through our platform are intended to be publicly accessible via their unique URLs. The information displayed on a digital card (name, title, contact details, social links) will be visible to anyone who scans the associated QR code or accesses the card URL. Please only include information you are comfortable sharing publicly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. If you do not accept cookies, some portions of our service may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have the right to access, correct, or delete your personal information at any time. You may also request that we restrict the processing of your data or object to its processing. To exercise these rights, please contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services after any changes constitutes your acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:<br />
              <strong>Identra</strong><br />
              Email: <a href="mailto:hello@identracards.com" className="text-gray-900 underline">hello@identracards.com</a><br />
              Website: <a href="https://identracards.com" className="text-gray-900 underline">identracards.com</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2026 Identra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}