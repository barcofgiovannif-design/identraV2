import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download } from "lucide-react";
import { api } from "@/api/client";
import { generateReceiptPdf } from "../utils/generateReceiptPdf";

export default function Success() {
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    console.log('[Success] Page loaded. session_id:', sessionId);

    if (sessionId) {
      const checkPurchase = async () => {
        try {
          const purchases = await api.entities.Purchase.filter({ stripe_session_id: sessionId });
          if (purchases && purchases.length > 0) {
            setPurchase(purchases[0]);
          }
        } catch (err) {
          console.error('[Success] Error checking purchase record:', err?.message, err);
        }
      };
      // Retry a few times since webhook may take a moment
      setTimeout(checkPurchase, 2000);
      setTimeout(checkPurchase, 6000);
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

            {purchase && (
              <Button
                variant="outline"
                className="w-full rounded-lg h-12 text-base mb-3 gap-2"
                onClick={() => generateReceiptPdf(purchase)}
              >
                <Download className="w-5 h-5" />
                Download Receipt (PDF)
              </Button>
            )}

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