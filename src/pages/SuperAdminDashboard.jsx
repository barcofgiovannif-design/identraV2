import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Link as LinkIcon, DollarSign, Users, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompaniesTable from "../components/admin/CompaniesTable";
import RevenueChart from "../components/admin/RevenueChart";
import GenerateCardsModal from "../components/admin/GenerateCardsModal";
import AllCardsTable from "../components/admin/AllCardsTable";
import OrdersTable from "../components/admin/OrdersTable";
import UsersTable from "../components/admin/UsersTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SuperAdminDashboard() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => base44.entities.Purchase.list('-created_date')
  });

  const { data: allCards = [] } = useQuery({
    queryKey: ['allCards'],
    queryFn: () => base44.entities.DigitalCard.list()
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalURLsPurchased = companies.reduce((sum, c) => sum + (c.purchased_urls || 0), 0);
  const totalURLsUsed = companies.reduce((sum, c) => sum + (c.used_urls || 0), 0);

  const stats = [
    {
      title: "Total Companies",
      value: companies.length,
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "URLs Purchased",
      value: totalURLsPurchased,
      icon: LinkIcon,
      color: "bg-purple-500"
    },
    {
      title: "URLs in Use",
      value: totalURLsUsed,
      icon: Users,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="cards">Digital Cards</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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

          <TabsContent value="revenue">
            <RevenueChart purchases={purchases} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Active Companies</span>
                    <span className="font-semibold">{companies.filter(c => c.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Suspended Companies</span>
                    <span className="font-semibold">{companies.filter(c => c.status === 'suspended').length}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">Total Active Cards</span>
                    <span className="font-semibold">{allCards.filter(c => c.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-600">URL Utilization Rate</span>
                    <span className="font-semibold">
                      {totalURLsPurchased > 0 ? Math.round((totalURLsUsed / totalURLsPurchased) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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