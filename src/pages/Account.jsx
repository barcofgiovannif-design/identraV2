import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingBag, Trash2, Save, Download, AlertTriangle } from "lucide-react";
import { generateReceiptPdf } from "../utils/generateReceiptPdf";

export default function Account() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setFormData({ full_name: u?.full_name || "" });
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: purchases = [] } = useQuery({
    queryKey: ['myPurchases', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Purchase.filter({ customer_email: user.email }, '-created_date')
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.auth.updateMe({ full_name: formData.full_name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    await base44.auth.logout('/');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500 mt-1">{user.email}</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-white border border-gray-200 mb-6">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Personal Data</TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2"><ShoppingBag className="w-4 h-4" />Purchase History</TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="profile">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="bg-gray-50 text-gray-500" />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                  <Button type="submit" disabled={saving} className="gap-2 bg-gray-900 hover:bg-gray-800">
                    <Save className="w-4 h-4" />
                    {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Deleting your account will log you out and remove your access. Your company data and cards will remain accessible to your team.
                </p>
                {!showDeleteConfirm ? (
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </Button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-700 mb-3">Are you sure? This action cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteAccount}>
                        Yes, delete my account
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History ({purchases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No purchases yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchases.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{p.plan_name || 'Package'} — {p.url_count} cards</p>
                          <p className="text-sm text-gray-500">{formatDate(p.created_date)} · {p.invoice_number || p.stripe_session_id?.slice(0, 16) || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">${Number(p.amount || 0).toFixed(2)}</span>
                          <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} variant="outline">
                            {p.status}
                          </Badge>
                          {p.status === 'completed' && (
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => generateReceiptPdf(p)}>
                              <Download className="w-3 h-3" />PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}