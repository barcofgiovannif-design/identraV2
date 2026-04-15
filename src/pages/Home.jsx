import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, QrCode, Users, Zap, Shield, Sparkles, Loader2, X, UserCircle, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [formData, setFormData] = useState({ company_name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(null);
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = not yet checked

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => setCurrentUser(null));

    // If redirected back after login with a plan pending, auto-open checkout
    const params = new URLSearchParams(window.location.search);
    const pendingPlan = params.get('plan');
    if (pendingPlan) {
      base44.entities.PricingPlan.filter({ is_active: true }).then(dbPlans => {
        const dbPlan = dbPlans.find(p => p.name.toLowerCase() === pendingPlan.toLowerCase());
        if (dbPlan) {
          const staticPlans = [
            { name: "Starter", urls: 5, monthly: 29, annual: 349 },
            { name: "Growth", urls: 10, monthly: 59, annual: 699 },
            { name: "Pro", urls: 30, monthly: 175, annual: 2099 },
            { name: "Team 40", urls: 40, monthly: 233, annual: 2799 },
            { name: "Enterprise 50", urls: 50, monthly: 291, annual: 3499 },
          ];
          const staticPlan = staticPlans.find(p => p.name.toLowerCase() === pendingPlan.toLowerCase());
          setCheckoutModal({ ...(staticPlan || {}), ...dbPlan, id: dbPlan.id });
          // Remove query param cleanly
          window.history.replaceState({}, '', window.location.pathname);
        }
      }).catch(() => {});
    }
  }, []);

  const handleGetStarted = async (plan) => {
    // Must be logged in to purchase
    if (!currentUser) {
      // Redirect to login, come back with plan pre-selected
      const returnUrl = `${window.location.origin}${window.location.pathname}?plan=${encodeURIComponent(plan.name)}`;
      base44.auth.redirectToLogin(returnUrl);
      return;
    }
    setPlanLoading(plan.name);
    const dbPlans = await base44.entities.PricingPlan.filter({ is_active: true });
    const dbPlan = dbPlans.find(p => p.name.toLowerCase() === plan.name.toLowerCase());
    setPlanLoading(null);
    if (!dbPlan) { alert('Plan not found. Please contact support.'); return; }
    setCheckoutModal({ ...plan, id: dbPlan.id });
    setFormData({ company_name: currentUser.full_name || "", email: currentUser.email || "" });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await base44.functions.invoke('stripeCheckout', {
        plan_id: checkoutModal.id,
        customer_email: currentUser?.email || formData.email,
        customer_name: formData.company_name,
        appUrl: window.location.origin
      });
      console.log('[Home] Checkout response:', response.data);
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        console.error('[Home] No checkout URL received', response.data);
        alert('Failed to create checkout. Please try again.');
      }
    } catch (error) {
      console.error('[Home] Checkout error:', error?.message, error);
      alert('Error creating checkout: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: QrCode,
      title: "Unique QR per Team Member",
      description: "Every team member gets a permanent QR code that never expires"
    },
    {
      icon: Zap,
      title: "Instant Contact Saving",
      description: "One-tap vCard download directly to phone contacts"
    },
    {
      icon: Sparkles,
      title: "Premium Profiles",
      description: "Apple-style elegant design that makes lasting impressions"
    },
    {
      icon: Users,
      title: "Centralized Management",
      description: "Manage your entire team's digital identities from one dashboard"
    },
    {
      icon: Shield,
      title: "Permanent URLs",
      description: "URLs never change - reliable digital identity infrastructure"
    }
  ];

  const plans = [
    {
      name: "Starter",
      urls: 5,
      monthly: 29,
      annual: 349,
      features: ["5 permanent URLs", "5 engraved executive metal NFC cards", "Unlimited updates", "Company branding", "vCard downloads"]
    },
    {
      name: "Growth",
      urls: 10,
      monthly: 59,
      annual: 699,
      popular: true,
      features: ["10 permanent URLs", "10 engraved executive metal NFC cards", "Unlimited updates", "Company branding", "vCard downloads", "Priority support"]
    },
    {
      name: "Pro",
      urls: 30,
      monthly: 175,
      annual: 2099,
      features: ["30 permanent URLs", "30 engraved executive metal NFC cards", "Unlimited updates", "Company branding", "vCard downloads", "Priority support", "Analytics"]
    },
    {
      name: "Team 40",
      urls: 40,
      monthly: 233,
      annual: 2799,
      features: ["40 permanent URLs", "40 engraved executive metal NFC cards", "Unlimited updates", "Company branding", "vCard downloads", "Priority support", "Analytics"]
    },
    {
      name: "Enterprise 50",
      urls: 50,
      monthly: 291,
      annual: 3499,
      features: ["50 permanent URLs", "50 engraved executive metal NFC cards", "Unlimited updates", "Company branding", "vCard downloads", "Priority support", "Analytics", "Dedicated account manager"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6993ef3c029e3c249b7f556c/bfcfbf9dc_main-identra-logo.png" 
            alt="Identra" 
            className="h-8"
          />
          <div className="flex gap-3 items-center">
            {currentUser === undefined ? null : currentUser ? (
              <>
                <Link to="/Account">
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-700">
                    <UserCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">{currentUser.full_name || currentUser.email}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-500" onClick={() => base44.auth.logout('/')}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
                <LogIn className="w-4 h-4" />
                Login / Register
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10 rounded-3xl" />
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Permanent Digital Business Cards
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Enterprise-grade digital identity infrastructure. Give every team member a permanent QR-enabled business card with instant contact saving.
            </motion.p>
            <motion.div 
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <a href="#pricing">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 h-12 rounded-lg">
                  View Pricing
                </Button>
              </a>
              <Link to={createPageUrl("Demo")}>
                <Button size="lg" variant="outline" className="px-8 h-12 rounded-lg">
                  See Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80" 
                alt="Team collaboration"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
              <motion.div
                className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Scan & Connect</p>
                    <p className="text-sm text-gray-600">Instant contact sharing</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-gray-600">
            Professional digital identity infrastructure built for scale
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-8">
          {features.slice(0, 3).map((feature, index) => (
            <motion.div 
              key={index} 
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <feature.icon className="w-6 h-6 text-gray-900" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
          {features.slice(3).map((feature, index) => (
            <motion.div 
              key={index + 3} 
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <feature.icon className="w-6 h-6 text-gray-900" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Purchase permanent digital identity slots for your team
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-2xl border-2 p-8 relative ${
                plan.popular ? "border-gray-900 shadow-xl" : plan.test ? "border-dashed border-yellow-400" : "border-gray-100"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              {plan.test && (
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-4 py-1 rounded-full">
                    🧪 Test
                  </span>
                </motion.div>
              )}
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="bg-gray-900 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Popular
                  </span>
                </motion.div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900">${plan.monthly}</span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>
              <div className="text-sm text-gray-500 mb-6">Billed annually (${plan.annual})</div>
              <div className="text-gray-600 mb-6">{plan.urls} permanent URLs</div>
              <Button
                  onClick={() => handleGetStarted(plan)}
                  disabled={planLoading === plan.name}
                  className={`w-full mb-6 rounded-lg ${
                    plan.popular
                      ? "bg-gray-900 hover:bg-gray-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  {planLoading === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Started"}
                </Button>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <motion.li 
                    key={idx} 
                    className="flex items-start gap-3 text-sm text-gray-600"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + (idx * 0.1) }}
                  >
                    <Check className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <motion.div 
          className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 rounded-3xl p-16 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80')] opacity-10 bg-cover bg-center" />
          <div className="relative z-10">
            <motion.h2 
              className="text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Ready to Modernize Your Team's Identity?
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Join forward-thinking companies using permanent digital business cards
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <a href="#pricing">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 px-8 h-12 rounded-lg">
                  Purchase Package
                </Button>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 space-y-3">
          <p>© 2026 Identra. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link to="/Privacy" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="/Terms" className="text-gray-500 hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{checkoutModal.name} Package</h2>
                <p className="text-gray-500">${checkoutModal.monthly}/month · {checkoutModal.urls} permanent URLs</p>
              </div>
              <button onClick={() => setCheckoutModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company / Contact Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  placeholder="Your company or contact name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={currentUser?.email || ''} disabled className="bg-gray-50 text-gray-500" />
                <p className="text-xs text-gray-400">Logged in as {currentUser?.email}</p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 h-12 text-base mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting to Stripe...</>
                ) : (
                  `Pay $${checkoutModal.annual} — Secure Checkout`
                )}
              </Button>
              <p className="text-xs text-gray-400 text-center">Powered by Stripe · Secure payment</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}