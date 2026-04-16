import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { generateReceiptPdf } from "../../utils/generateReceiptPdf";

export default function OrdersTable({ purchases, companies }) {
  const [search, setSearch] = useState("");

  const enriched = purchases.map(p => {
    const company = companies.find(c => c.id === p.company_id);
    return { ...p, company };
  });

  const filtered = enriched.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.customer_email || p.company?.email || "").toLowerCase().includes(q) ||
      (p.customer_name || p.company?.company_name || "").toLowerCase().includes(q) ||
      (p.invoice_number || "").toLowerCase().includes(q) ||
      (p.plan_name || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Orders ({purchases.length})</CardTitle>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Invoice</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Buyer</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Plan</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Cards</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Amount</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No orders found</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 font-mono text-xs text-gray-500">{p.invoice_number || '-'}</td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900">{p.customer_name || p.company?.company_name || '-'}</div>
                    <div className="text-xs text-gray-500">{p.customer_email || p.company?.email || '-'}</div>
                  </td>
                  <td className="py-3 px-2 text-gray-700">{p.plan_name || '-'}</td>
                  <td className="py-3 px-2 text-gray-700">{p.url_count || 0}</td>
                  <td className="py-3 px-2 font-semibold text-gray-900">${Number(p.amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-2 text-gray-500">{formatDate(p.created_at)}</td>
                  <td className="py-3 px-2">
                    <Badge
                      className={
                        p.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }
                      variant="outline"
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => generateReceiptPdf({
                        ...p,
                        customer_name: p.customer_name || p.company?.company_name,
                        customer_email: p.customer_email || p.company?.email,
                      })}
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}