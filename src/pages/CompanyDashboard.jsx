import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import CreateCardModal from "../components/company/CreateCardModal";
import CardsList from "../components/company/CardsList";
import StatsOverview from "../components/company/StatsOverview";
import ActivityPanel from "../components/company/ActivityPanel";
import LeadsPanel from "../components/company/LeadsPanel";
import CsvImportModal from "../components/company/CsvImportModal";
import SettingsPanel from "../components/company/SettingsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CompanyDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const user = await api.auth.me();
        if (user.company_id) {
          const c = await api.entities.Company.get(user.company_id);
          setCompany(c);
        } else {
          const companies = await api.entities.Company.filter({ email: user.email });
          if (companies.length > 0) setCompany(companies[0]);
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['digitalCards', company?.id],
    queryFn: () => company ? api.entities.DigitalCard.filter({ company_id: company.id }) : [],
    enabled: !!company,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading…</h2>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-lg mx-6">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Company Found</h2>
            <p className="text-gray-600 mb-6">
              Your account is not associated with a company yet. Please complete a purchase to create your company account.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableSlots = company.purchased_urls - company.used_urls;
  const canCreateCard = availableSlots > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{company.company_name}</h1>
            <p className="text-gray-600">Manage your team's digital business cards</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              disabled={!canCreateCard}
              className="rounded-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={!canCreateCard}
              className="bg-gray-900 hover:bg-gray-800 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Card
            </Button>
          </div>
        </div>

        <StatsOverview company={company} totalCards={cards.length} />

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

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="bg-white border border-gray-200 flex-wrap h-auto">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <CardsList cards={cards} company={company} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityPanel company={company} />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsPanel company={company} cards={cards} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel company={company} cards={cards} />
          </TabsContent>
        </Tabs>
      </div>

      {showCreateModal && (
        <CreateCardModal
          company={company}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
            setShowCreateModal(false);
          }}
        />
      )}

      {showImportModal && (
        <CsvImportModal
          company={company}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}
