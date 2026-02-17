import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Link as LinkIcon, TrendingUp } from "lucide-react";
import CreateCardModal from "../components/company/CreateCardModal";
import CardsList from "../components/company/CardsList";
import StatsOverview from "../components/company/StatsOverview";
import BrandingSettings from "../components/company/BrandingSettings";

export default function CompanyDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [company, setCompany] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadCompany = async () => {
      const user = await base44.auth.me();
      const companies = await base44.entities.Company.filter({ email: user.email });
      if (companies.length > 0) {
        setCompany(companies[0]);
      }
    };
    loadCompany();
  }, []);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['digitalCards', company?.id],
    queryFn: () => company ? base44.entities.DigitalCard.filter({ company_id: company.id }) : [],
    enabled: !!company
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  const availableSlots = company.purchased_urls - company.used_urls;
  const canCreateCard = availableSlots > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.company_name}</h1>
            <p className="text-gray-600">Manage your team's digital business cards</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateCard}
            className="bg-gray-900 hover:bg-gray-800 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Card
          </Button>
        </div>

        {/* Stats Overview */}
        <StatsOverview company={company} totalCards={cards.length} />

        {/* Available Slots Warning */}
        {availableSlots <= 2 && availableSlots > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <p className="text-amber-800">
                ⚠️ You have only <strong>{availableSlots}</strong> URL slot{availableSlots !== 1 ? 's' : ''} remaining. Consider upgrading your plan.
              </p>
            </CardContent>
          </Card>
        )}

        {availableSlots === 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4 flex justify-between items-center">
              <p className="text-red-800">
                🚫 You've used all your URL slots. Upgrade to create more cards.
              </p>
              <Button className="bg-red-600 hover:bg-red-700 rounded-lg">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cards List */}
        <CardsList cards={cards} company={company} isLoading={isLoading} />

        {/* Branding Settings */}
        <BrandingSettings company={company} />
      </div>

      {/* Create Card Modal */}
      {showCreateModal && (
        <CreateCardModal
          company={company}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['digitalCards']);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}