import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Success() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    console.log('[Success] Page loaded. session_id:', sessionId);

    if (sessionId) {
      // Debug: verify the webhook was processed by checking if a purchase was created
      base44.entities.Purchase.filter({ stripe_session_id: sessionId })
        .then(purchases => {
          console.log('[Success] Purchases found for session:', purchases);
          if (!purchases || purchases.length === 0) {
            console.warn('[Success] No purchase record found yet — webhook may not have fired or failed.');
          }
        })
        .catch(err => {
          console.error('[Success] Error checking purchase record:', err?.message, err);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <Card className="shadow-xl">
          <CardContent className="py-12 px-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Your payment has been successfully received.
            </p>
            <p className="text-gray-500 mb-8">
              We'll activate your account and send your login credentials shortly.
            </p>

            <Link to={createPageUrl("Home")}>
              <Button className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg h-12 text-base">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Contact us at support@identra.com
        </p>
      </div>
    </div>
  );
}