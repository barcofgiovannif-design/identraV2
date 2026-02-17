import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Linkedin, Twitter, MessageCircle, Download, QrCode, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Demo() {
  const demoCard = {
    full_name: "Sarah Johnson",
    title: "Chief Marketing Officer",
    company_name: "TechVision Inc.",
    email: "sarah.johnson@techvision.com",
    phone: "+1 (555) 123-4567",
    overview: "Driving digital transformation and brand innovation with 15+ years of marketing leadership experience.",
    social_links: {
      linkedin: "https://linkedin.com/in/sarahjohnson",
      twitter: "https://twitter.com/sarahjohnson"
    },
    brand_color: "#6366f1"
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to={createPageUrl("Home")} className="text-xl font-semibold text-gray-900">
            DigitalCard
          </Link>
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            See It In Action
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience how your team's digital business cards will look and work
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Demo Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Demo Card</h2>
            <Card className="overflow-hidden shadow-xl">
              {/* Header Section */}
              <div
                className="h-32"
                style={{ backgroundColor: demoCard.brand_color }}
              />

              <CardContent className="pt-0 px-6 pb-6">
                {/* Profile Section */}
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg mx-auto border-4 border-white"
                       style={{ color: demoCard.brand_color }}>
                    {demoCard.full_name.charAt(0)}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{demoCard.full_name}</h3>
                  <p className="text-xl text-gray-600 mb-1">{demoCard.title}</p>
                  <p className="text-lg text-gray-500">{demoCard.company_name}</p>
                </div>

                {/* Overview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-center">{demoCard.overview}</p>
                </div>

                {/* Contact Actions */}
                <div className="space-y-3 mb-6">
                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start" disabled>
                    <Mail className="w-5 h-5 mr-3" />
                    {demoCard.email}
                  </Button>

                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start" disabled>
                    <Phone className="w-5 h-5 mr-3" />
                    {demoCard.phone}
                  </Button>

                  <Button variant="outline" className="w-full rounded-lg h-12 justify-start" disabled>
                    <MessageCircle className="w-5 h-5 mr-3" />
                    WhatsApp
                  </Button>
                </div>

                {/* Social Links */}
                <div className="flex gap-3 justify-center mb-6">
                  <Button variant="outline" size="icon" className="rounded-full w-12 h-12" disabled>
                    <Linkedin className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-12 h-12" disabled>
                    <Twitter className="w-5 h-5" />
                  </Button>
                </div>

                {/* Download vCard */}
                <Button
                  className="w-full rounded-lg h-12"
                  style={{ backgroundColor: demoCard.brand_color }}
                  disabled
                >
                  <Download className="w-5 h-5 mr-2" />
                  Save to Contacts
                </Button>
              </CardContent>
            </Card>

            <p className="text-center text-gray-500 text-sm mt-4">
              This is a demo - interactions are disabled
            </p>
          </motion.div>

          {/* Right: Features & Benefits */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What Your Cards Include</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Unique QR Code</h3>
                    <p className="text-gray-600 text-sm">
                      Each team member gets a permanent, branded QR code that never expires
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">One-Tap Contact Save</h3>
                    <p className="text-gray-600 text-sm">
                      Visitors can instantly download your contact info to their phone
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Direct Contact Links</h3>
                    <p className="text-gray-600 text-sm">
                      Email, phone, WhatsApp, and social links all clickable
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Custom Branding</h3>
                    <p className="text-gray-600 text-sm">
                      Add your company logo and brand colors to every card
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real Use Cases</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Print QR codes on business cards, brochures, or badges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Add to email signatures for instant contact sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Display at trade shows and networking events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>Share via LinkedIn, WhatsApp, or text message</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Link to={createPageUrl("Home") + "#pricing"} className="flex-1">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg h-12">
                  View Pricing
                </Button>
              </Link>
              <Link to={createPageUrl("Home")} className="flex-1">
                <Button variant="outline" className="w-full rounded-lg h-12">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}