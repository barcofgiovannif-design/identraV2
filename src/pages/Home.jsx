import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Check, QrCode, Users, Zap, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
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
      price: 49,
      features: ["5 permanent URLs", "5 QR codes", "Unlimited updates", "Company branding", "vCard downloads"]
    },
    {
      name: "Growth",
      urls: 10,
      price: 89,
      popular: true,
      features: ["10 permanent URLs", "10 QR codes", "Unlimited updates", "Company branding", "vCard downloads", "Priority support"]
    },
    {
      name: "Pro",
      urls: 20,
      price: 159,
      features: ["20 permanent URLs", "20 QR codes", "Unlimited updates", "Company branding", "vCard downloads", "Priority support", "Analytics"]
    },
    {
      name: "Enterprise",
      urls: 50,
      price: 349,
      features: ["50 permanent URLs", "50 QR codes", "Unlimited updates", "Company branding", "vCard downloads", "Priority support", "Analytics", "Dedicated account manager"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-semibold text-gray-900">DigitalCard</div>
          <div className="flex gap-4 items-center">
            <Button 
              variant="ghost" 
              onClick={() => base44.auth.redirectToLogin()}
            >
              Sign In
            </Button>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow"
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-2xl border-2 p-8 relative ${
                plan.popular ? "border-gray-900 shadow-xl" : "border-gray-100"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
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
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600 ml-2">/ one-time</span>
              </div>
              <div className="text-gray-600 mb-6">{plan.urls} permanent URLs</div>
              <Link to={createPageUrl("Checkout") + `?plan=${plan.name.toLowerCase()}`}>
                <Button
                  className={`w-full mb-6 rounded-lg ${
                    plan.popular
                      ? "bg-gray-900 hover:bg-gray-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  Get Started
                </Button>
              </Link>
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
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>© 2026 DigitalCard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}