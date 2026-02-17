import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Button } from "@/components/ui/button";
import { Check, QrCode, Users, Zap, Shield, Sparkles } from "lucide-react";

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
            <Link to={createPageUrl("Login")}>
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Permanent Digital Business Cards for Modern Teams
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Enterprise-grade digital identity infrastructure. Give every team member a permanent QR-enabled business card with instant contact saving.
          </p>
          <div className="flex gap-4 justify-center">
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
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-gray-600">
            Professional digital identity infrastructure built for scale
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Purchase permanent digital identity slots for your team
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl border-2 p-8 relative ${
                plan.popular ? "border-gray-900" : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-900 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Popular
                  </span>
                </div>
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
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="bg-gray-900 rounded-3xl p-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Modernize Your Team's Identity?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join forward-thinking companies using permanent digital business cards
          </p>
          <a href="#pricing">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 px-8 h-12 rounded-lg">
              Purchase Package
            </Button>
          </a>
        </div>
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