import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: April 15, 2026</p>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using Identra's services at identracards.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              Identra provides a digital business card platform that allows companies to create, manage, and share permanent digital identity profiles for their team members. Our service includes permanent unique URLs, QR code generation, NFC card integration, and a centralized management dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <p className="text-gray-600 leading-relaxed">
              To use certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration and to update it as necessary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Purchases and Payments</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Our service is offered on a subscription or one-time purchase basis. By purchasing a plan, you agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>All fees are stated in US Dollars and are non-refundable unless otherwise stated</li>
              <li>Payments are processed securely through Stripe</li>
              <li>You authorize us to charge your payment method for the selected plan</li>
              <li>URL slots purchased are allocated to your account and cannot be transferred</li>
              <li>Prices are subject to change with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You agree not to use our services to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Upload or transmit malicious code or harmful content</li>
              <li>Impersonate any person or entity</li>
              <li>Engage in any fraudulent or deceptive activity</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Digital Card Content</h2>
            <p className="text-gray-600 leading-relaxed">
              You are solely responsible for the content displayed on your digital business cards. You represent and warrant that you have all necessary rights to the content you upload or display. Identra reserves the right to remove content that violates these terms or is otherwise objectionable, without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Permanent URLs</h2>
            <p className="text-gray-600 leading-relaxed">
              Identra provides permanent unique URLs for each digital card. While we intend for these URLs to remain active for the lifetime of your account, we cannot guarantee perpetual availability. In the event that service is discontinued, we will provide reasonable advance notice to allow you to transition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              The Identra platform, including its design, software, and content, is owned by Identra and is protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of our service without explicit written permission. You retain ownership of the content you create and upload to our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate your account at our discretion if you violate these Terms of Service. Upon termination, your right to use the service will immediately cease. You may also terminate your account at any time by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services are provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure. Your use of the service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the fullest extent permitted by law, Identra shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use our services, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes by posting a notice on our website or sending an email. Your continued use of the service after changes are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising under these terms shall be resolved through good-faith negotiation, and if necessary, through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:<br />
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