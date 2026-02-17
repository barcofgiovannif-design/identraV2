import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, Mail } from "lucide-react";

export default function Success() {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    setSessionId(session || "");
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Order...</h2>
            <p className="text-gray-600">Please wait while we set up your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardContent className="py-12 px-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to DigitalCard! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Your purchase was successful and your account is now active
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent a welcome email with instructions on how to:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Sign in to your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Set up your company branding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Create digital cards for your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Download and share your QR codes</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link to={createPageUrl("Home")}>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg h-12 text-lg">
                  Sign In to Dashboard
                </Button>
              </Link>

              <Link to={createPageUrl("Demo")}>
                <Button variant="outline" className="w-full rounded-lg h-12">
                  See Demo Card
                </Button>
              </Link>
            </div>

            {sessionId && (
              <p className="text-xs text-gray-400 mt-6">
                Order ID: {sessionId.substring(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact our support team anytime
        </p>
      </div>
    </div>
  );
}