import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export default function Checkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ company_name: "", email: "" });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['pricingPlans'],
    queryFn: () => base44.entities.PricingPlan.filter({ is_active: true })
  });

  const selectedPlan = plans.find(p => p.name.toLowerCase() === (planParam || '').toLowerCase()) || plans[0];

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setLoading(true);
    const response = await base44.functions.invoke('stripeCheckout', {
      plan_id: selectedPlan.id,
      customer_email: formData.email,
      customer_name: formData.company_name
    });
    window.location.href = response.data.url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Purchase</CardTitle>
          {selectedPlan && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{selectedPlan.name} Package</p>
                  <p className="text-sm text-gray-600">{selectedPlan.url_count} permanent digital card URLs</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">${selectedPlan.price}</p>
              </div>
              <ul className="mt-3 space-y-1">
                {selectedPlan.features?.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3 h-3 text-gray-900 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                placeholder="Your company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="This email will be used for login"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 h-12 text-base mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting to Stripe...</>
              ) : (
                `Pay $${selectedPlan?.price} — Secure Checkout`
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              You'll be redirected to Stripe's secure payment page
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}