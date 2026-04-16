import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, DollarSign, Link as LinkIcon, Users, Activity, TrendingUp, Cpu, Mail,
} from "lucide-react";

const WINDOWS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export default function PlatformOverview() {
  const [days, setDays] = useState(30);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', days],
    queryFn: () => api.admin.stats({ days }),
    refetchInterval: 30_000,
  });

  if (isLoading || !stats) {
    return <div className="text-gray-500 text-center py-10">Loading metrics…</div>;
  }

  const cards = [
    { title: 'Active customers', value: stats.companies.active, sub: `of ${stats.companies.total} total`, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { title: `Revenue (${days}d)`, value: `$${stats.revenue.window.toLocaleString()}`, sub: `All-time: $${stats.revenue.total.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { title: `Taps (${days}d)`, value: stats.taps.window.toLocaleString(), sub: `${stats.urls.active} active URLs`, icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { title: `Leads (${days}d)`, value: stats.leads.window.toLocaleString(), sub: `All-time: ${stats.leads.total}`, icon: Mail, color: 'text-orange-600 bg-orange-50' },
    { title: 'Profiles', value: stats.profiles.total, sub: `Slots used: ${stats.urls.used_slots}/${stats.urls.purchased_slots}`, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Hardware', value: stats.hardware.total, sub: 'Physical NFC cards', icon: Cpu, color: 'text-teal-600 bg-teal-50' },
    { title: 'URLs', value: stats.urls.total, sub: `Active: ${stats.urls.active}`, icon: LinkIcon, color: 'text-pink-600 bg-pink-50' },
    { title: 'Utilization', value: `${stats.urls.purchased_slots > 0 ? Math.round(stats.urls.used_slots / stats.urls.purchased_slots * 100) : 0}%`, sub: 'Slots used / purchased', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  const peak = Math.max(1, ...stats.taps.by_day.map((d) => d.taps));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform overview</h2>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => setDays(w.value)}
              className={`px-3 py-1 rounded-md text-sm ${days === w.value ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="border-gray-200">
            <CardContent className="pt-5">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">{c.title}</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">{c.value}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{c.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${c.color}`}><c.icon className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Taps per day</h3>
          <div className="flex items-end gap-1 h-28 bg-gray-50 rounded-lg p-3">
            {stats.taps.by_day.length === 0 ? (
              <div className="flex-1 text-center text-sm text-gray-400 self-center">No activity yet.</div>
            ) : (
              stats.taps.by_day.map((d) => (
                <div key={d.date} className="flex-1 min-w-[3px] flex flex-col justify-end" title={`${d.date}: ${d.taps}`}>
                  <div className="bg-gray-900 rounded-t" style={{ height: `${(d.taps / peak) * 100}%` }} />
                </div>
              ))
            )}
          </div>
          {stats.taps.by_day.length > 0 && (
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{stats.taps.by_day[0].date}</span>
              <span>{stats.taps.by_day[stats.taps.by_day.length - 1].date}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopList title={`Top customers by taps (${days}d)`} items={stats.top_by_taps} metric={(c) => `${c.taps} taps`} />
        <TopList title="Top customers by leads" items={stats.top_by_leads} metric={(c) => `${c.leads} leads`} />
        <TopList title="Top customers by revenue" items={stats.top_by_revenue} metric={(c) => `$${c.revenue.toLocaleString()}`} />
      </div>
    </div>
  );
}

function TopList({ title, items, metric }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-semibold mb-3">{title}</h3>
        {items.filter((i) => i.name).length === 0 ? (
          <p className="text-sm text-gray-400">No data.</p>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                  <span className="text-sm text-gray-900 truncate">{c.name}</span>
                  {c.status !== 'active' && <Badge variant="outline" className="text-[10px]">{c.status}</Badge>}
                </div>
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{metric(c)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
