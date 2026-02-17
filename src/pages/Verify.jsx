import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    verifyMagicLink();
  }, []);

  const verifyMagicLink = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const email = urlParams.get('email');

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid or missing verification link");
        return;
      }

      // Check if company exists with this email
      const companies = await base44.entities.Company.filter({ email });
      
      if (!companies || companies.length === 0) {
        setStatus("error");
        setMessage("No account found with this email");
        return;
      }

      const company = companies[0];

      // For demo purposes, we'll accept any token and redirect to login
      // In production, you'd validate the token and expiration
      
      // Redirect to Base44 login page which will handle the authentication
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Verification error:', error);
      setStatus("error");
      setMessage("An error occurred during verification");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying...</h2>
              <p className="text-gray-600">Please wait while we verify your login link</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Success!</h2>
              <p className="text-gray-600 mb-6">You're being redirected to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link to={createPageUrl("Home")}>
                <Button className="bg-gray-900 hover:bg-gray-800 rounded-lg">
                  Return to Home
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}