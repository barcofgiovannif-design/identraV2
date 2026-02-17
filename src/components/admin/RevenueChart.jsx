import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueChart({ purchases }) {
  const monthlyRevenue = purchases.reduce((acc, purchase) => {
    const month = new Date(purchase.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + purchase.amount;
    return acc;
  }, {});

  const data = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#111827" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}