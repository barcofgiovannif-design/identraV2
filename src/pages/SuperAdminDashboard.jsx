import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import CompaniesTable from "../components/admin/CompaniesTable";
import RevenueChart from "../components/admin/RevenueChart";
import GenerateCardsModal from "../components/admin/GenerateCardsModal";
import AllCardsTable from "../components/admin/AllCardsTable";
import OrdersTable from "../components/admin/OrdersTable";
import UsersTable from "../components/admin/UsersTable";
import HardwareTable from "../components/admin/HardwareTable";
import PlatformOverview from "../components/admin/PlatformOverview";
import AdminLeadsPanel from "../components/admin/AdminLeadsPanel";
import AuditLogPanel from "../components/company/AuditLogPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SuperAdminDashboard() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }
  if (!user) return <Navigate to="/Login" replace />;
  if (user.role !== 'support' && user.role !== 'superadmin') {
    return <Navigate to="/CompanyDashboard" replace />;
  }

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => api.entities.User.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.entities.Company.list(),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.entities.Purchase.list('-created_at'),
  });

  const { data: allCards = [] } = useQuery({
    queryKey: ['allCards'],
    queryFn: () => api.entities.DigitalCard.list(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-600">Platform overview and company management</p>
          </div>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Generate Cards
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="cards">Digital Cards</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PlatformOverview />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable users={users} purchases={purchases} onRefresh={refetchUsers} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable purchases={purchases} companies={companies} />
          </TabsContent>

          <TabsContent value="companies">
            <CompaniesTable companies={companies} />
          </TabsContent>

          <TabsContent value="cards">
            <AllCardsTable cards={allCards} companies={companies} />
          </TabsContent>

          <TabsContent value="hardware">
            <HardwareTable companies={companies} />
          </TabsContent>

          <TabsContent value="leads">
            <AdminLeadsPanel companies={companies} />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueChart purchases={purchases} />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditSection companies={companies} />
          </TabsContent>
        </Tabs>

        <GenerateCardsModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          companies={companies}
        />
      </div>
    </div>
  );
}

// Admin audit: lets the superadmin browse any company's audit trail.
function AdminAuditSection({ companies }) {
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const selected = companies.find((c) => c.id === companyId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Company:</label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
      </div>
      {selected && <AuditLogPanel company={selected} />}
    </div>
  );
}
