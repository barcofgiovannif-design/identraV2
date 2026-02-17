import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Checkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: ""
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['pricingPlans'],
    queryFn: () => base44.entities.PricingPlan.filter({ is_active: true })
  });

  React.useEffect(() => {
    if (plans.length > 0 && planParam) {
      const plan = plans.find(p => p.name.toLowerCase() === planParam.toLowerCase());
      if (plan) setSelectedPlan(plan);
    }
  }, [plans, planParam]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('stripeCheckout', {
        plan_id: selectedPlan.id,
        customer_email: formData.email,
        customer_name: formData.company_name
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Package</h1>
          <p className="text-lg text-gray-600">One-time purchase for permanent digital business cards</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all h-full ${
                  selectedPlan?.id === plan.id
                    ? 'border-2 border-gray-900 shadow-lg'
                    : 'border-2 border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">one-time</span>
                </div>
                <div className="mt-2">
                  <Badge className="bg-gray-100 text-gray-900">
                    {plan.url_count} URLs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>

        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPlan.name} Package</p>
                      <p className="text-sm text-gray-600">{selectedPlan.url_count} permanent digital card URLs</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${selectedPlan.price}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      className="rounded-lg"
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
                      className="rounded-lg"
                      placeholder="This email will be used for login"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 rounded-lg h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Proceed to Payment - $${selectedPlan.price}`
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You'll be redirected to Stripe's secure checkout page
                </p>
              </form>
            </CardContent>
          </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}