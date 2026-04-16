import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Activity, Smartphone, Monitor, Apple } from "lucide-react";

export default function AnalyticsPanel({ company }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['urlStats', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.urls.stats({ company_id: company.id }),
    refetchInterval: 30_000,
  });

  if (!company) return null;

  const total = stats?.total_taps ?? 0;
  const byDevice = stats?.by_device ?? {};
  const byDay = stats?.by_day ?? [];
  const peak = Math.max(1, ...byDay.map((d) => d.taps));

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Activity (last 30 days)
            </h2>
            <p className="text-sm text-gray-500">Every QR scan or profile view counts as 1 tap.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{isLoading ? '—' : total}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total taps</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <DeviceChip icon={<Apple className="w-4 h-4" />} label="iOS" value={byDevice.ios || 0} />
          <DeviceChip icon={<Smartphone className="w-4 h-4" />} label="Android" value={byDevice.android || 0} />
          <DeviceChip icon={<Monitor className="w-4 h-4" />} label="Desktop" value={byDevice.desktop || 0} />
          <DeviceChip icon={<Smartphone className="w-4 h-4" />} label="Other" value={byDevice.other || 0} />
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-end gap-1 h-20">
            {byDay.length === 0 ? (
              <div className="flex-1 text-center text-sm text-gray-400 self-center">No activity recorded yet.</div>
            ) : (
              byDay.map((d) => (
                <div key={d.date} className="flex-1 min-w-[3px] flex flex-col justify-end" title={`${d.date}: ${d.taps} taps`}>
                  <div
                    className="bg-gray-900 rounded-t"
                    style={{ height: `${(d.taps / peak) * 100}%` }}
                  />
                </div>
              ))
            )}
          </div>
          {byDay.length > 0 && (
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{byDay[0].date}</span>
              <span>{byDay[byDay.length - 1].date}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceChip({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
      <span className="flex items-center gap-2 text-sm text-gray-600">{icon}{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
