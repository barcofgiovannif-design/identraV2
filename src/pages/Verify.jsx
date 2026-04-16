import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) {
        setStatus("error");
        setMessage("Invalid or missing verification link");
        return;
      }
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Verification failed');
        }
        setStatus("success");
        setTimeout(() => navigate('/CompanyDashboard'), 800);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          {status === "verifying" && (<>
            <Loader2 className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your login link</p>
          </>)}
          {status === "success" && (<>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Success!</h2>
            <p className="text-gray-600 mb-6">You're being redirected to your dashboard...</p>
          </>)}
          {status === "error" && (<>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/">
              <Button className="bg-gray-900 hover:bg-gray-800 rounded-lg">Return to Home</Button>
            </Link>
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}
