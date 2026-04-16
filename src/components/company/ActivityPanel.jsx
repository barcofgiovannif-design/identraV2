import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, Activity, Smartphone, Globe2, Target, Clock, MapPin, Monitor, Apple,
} from "lucide-react";

const WINDOWS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export default function ActivityPanel({ company }) {
  const [days, setDays] = useState(30);
  const [drillMember, setDrillMember] = useState(null);
  const scope = company?.id ? { company_id: company.id, days } : null;

  const { data: members = { members: [] } } = useQuery({
    queryKey: ['activity.byMember', scope],
    enabled: !!scope,
    queryFn: () => api.activity.byMember({ company_id: company.id, days }),
  });
  const { data: breakdown } = useQuery({
    queryKey: ['activity.breakdown', scope],
    enabled: !!scope,
    queryFn: () => api.activity.breakdown({ company_id: company.id, days }),
  });
  const { data: funnel } = useQuery({
    queryKey: ['activity.funnel', scope],
    enabled: !!scope,
    queryFn: () => api.activity.funnel({ company_id: company.id, days }),
  });

  if (!company) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Team activity
          </h2>
          <p className="text-sm text-gray-500">Taps, downloads, clicks and conversion by team member.</p>
        </div>
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

      {funnel && <FunnelCard funnel={funnel} />}

      <MemberLeaderboard members={members.members} onDrill={setDrillMember} />

      {breakdown && <BreakdownCards breakdown={breakdown} />}

      {drillMember && (
        <MemberTimelineModal member={drillMember} onClose={() => setDrillMember(null)} />
      )}
    </div>
  );
}

// Tier 3 — Conversion Funnel with deltas
function FunnelCard({ funnel }) {
  const steps = [
    { key: 'views', label: 'Profile views', value: funnel.views, delta: funnel.deltas?.views, color: 'bg-blue-500' },
    { key: 'vcard_downloads', label: 'vCards downloaded', value: funnel.vcard_downloads, delta: funnel.deltas?.vcard_downloads, color: 'bg-indigo-500' },
    { key: 'leads', label: 'Leads captured', value: funnel.leads, delta: funnel.deltas?.leads, color: 'bg-green-500' },
  ];
  const peak = Math.max(1, ...steps.map((s) => s.value));
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2"><Target className="w-4 h-4" /> Conversion funnel ({funnel.days}d)</h3>
        <p className="text-xs text-gray-500 mb-4">How many visitors move down the funnel toward a captured lead. Percentages compare with the prior {funnel.days}-day window.</p>
        <div className="space-y-2">
          {steps.map((s, i) => {
            const pct = (s.value / peak) * 100;
            const conv = i === 0 ? null : (steps[0].value > 0 ? (s.value / steps[0].value) * 100 : 0);
            return (
              <div key={s.key}>
                <div className="flex justify-between items-baseline text-xs text-gray-600 mb-1">
                  <span>{s.label}</span>
                  <span className="font-semibold flex items-center gap-2">
                    <Delta value={s.delta} />
                    {s.value.toLocaleString()}
                    {conv !== null && <span className="text-gray-400">· {conv.toFixed(1)}% of views</span>}
                  </span>
                </div>
                <div className="h-5 bg-gray-100 rounded">
                  <div className={`h-full rounded ${s.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Link clicks</div>
            <div className="font-semibold flex items-center gap-2"><Delta value={funnel.deltas?.link_clicks} />{funnel.link_clicks.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">View → Lead rate</div>
            <div className="font-semibold">{(funnel.rates.lead_rate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Small inline delta chip (↑ 23% / ↓ 5% / flat).
function Delta({ value }) {
  if (value === undefined || value === null || !isFinite(value)) return null;
  const pct = Math.round(value * 100);
  if (pct === 0) return <span className="text-[10px] text-gray-400">flat</span>;
  const up = pct > 0;
  return (
    <span className={`text-[10px] ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

// Tier 1 — Sortable leaderboard with per-row deltas
function MemberLeaderboard({ members, onDrill }) {
  const [sortKey, setSortKey] = React.useState('views');
  const [dir, setDir] = React.useState('desc');

  const setSort = (k) => {
    if (sortKey === k) setDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setDir('desc'); }
  };
  const sorted = React.useMemo(() => {
    const copy = [...members];
    copy.sort((a, b) => {
      const va = sortKey === 'name' ? (a.name || '') : (a[sortKey] || 0);
      const vb = sortKey === 'name' ? (b.name || '') : (b[sortKey] || 0);
      if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return dir === 'asc' ? va - vb : vb - va;
    });
    return copy;
  }, [members, sortKey, dir]);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const h = (k, label, align = 'right') => (
    <th className={`py-2 pr-3 text-${align} cursor-pointer select-none`} onClick={() => setSort(k)}>
      <span className={sortKey === k ? 'text-gray-900 font-semibold' : ''}>{label}{sortKey === k && (dir === 'asc' ? ' ↑' : ' ↓')}</span>
    </th>
  );

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Member leaderboard</h3>
        {members.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-2 pr-3">#</th>
                  {h('name', 'Member', 'left')}
                  {h('views', 'Views')}
                  {h('vcard_downloads', 'vCards')}
                  {h('link_clicks', 'Clicks')}
                  {h('leads', 'Leads')}
                  {h('conversion_rate', 'Conv.')}
                  <th className="py-2 pr-3">Last tap</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, i) => (
                  <tr key={m.url_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs font-mono text-gray-400">/{m.short_code}</div>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <div className="flex justify-end items-baseline gap-1">
                        <Delta value={m.deltas?.views} />
                        <span className="font-semibold">{m.views.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right">{m.vcard_downloads}</td>
                    <td className="py-2 pr-3 text-right">{m.link_clicks}</td>
                    <td className="py-2 pr-3 text-right">
                      <div className="flex justify-end items-baseline gap-1">
                        <Delta value={m.deltas?.leads} />
                        <span>{m.leads}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right">{(m.conversion_rate * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-3 text-xs text-gray-500">{formatDate(m.last_tap)}</td>
                    <td className="py-2 pr-3">
                      <button onClick={() => onDrill(m)} className="text-xs text-gray-700 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Tier 2 — Geo + device breakdown
function BreakdownCards({ breakdown }) {
  const peakCountry = Math.max(1, ...breakdown.by_country.map((d) => d.count));
  const peakCity = Math.max(1, ...breakdown.by_city.map((d) => d.count));
  const peakHour = Math.max(1, ...breakdown.by_hour.map((d) => d.count));
  const deviceIcon = (k) => k === 'ios' ? Apple : k === 'android' ? Smartphone : k === 'desktop' ? Monitor : Smartphone;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Globe2 className="w-4 h-4" /> Top countries</h3>
          {breakdown.by_country.length === 0 ? <p className="text-sm text-gray-400">No geo data yet.</p> : (
            <div className="space-y-2">
              {breakdown.by_country.slice(0, 10).map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-xs mb-1"><span>{d.key || 'Unknown'}</span><span className="font-semibold">{d.count}</span></div>
                  <div className="h-2 bg-gray-100 rounded"><div className="h-2 bg-gray-900 rounded" style={{ width: `${(d.count / peakCountry) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Top cities</h3>
          {breakdown.by_city.length === 0 ? <p className="text-sm text-gray-400">No city data yet.</p> : (
            <div className="space-y-2">
              {breakdown.by_city.slice(0, 10).map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-xs mb-1"><span className="truncate">{d.key}</span><span className="font-semibold shrink-0 ml-2">{d.count}</span></div>
                  <div className="h-2 bg-gray-100 rounded"><div className="h-2 bg-gray-900 rounded" style={{ width: `${(d.count / peakCity) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Device / OS / Browser</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Device</div>
              <div className="space-y-1">
                {breakdown.by_device.slice(0, 4).map((d) => {
                  const Icon = deviceIcon(d.key);
                  return <div key={d.key} className="flex items-center justify-between"><span className="flex items-center gap-1 text-xs"><Icon className="w-3 h-3" />{d.key}</span><span className="font-semibold">{d.count}</span></div>;
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">OS</div>
              <div className="space-y-1">
                {breakdown.by_os.slice(0, 5).map((d) => <div key={d.key} className="flex justify-between text-xs"><span className="truncate">{d.key || 'Unknown'}</span><span className="font-semibold">{d.count}</span></div>)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Browser</div>
              <div className="space-y-1">
                {breakdown.by_browser.slice(0, 5).map((d) => <div key={d.key} className="flex justify-between text-xs"><span className="truncate">{d.key || 'Unknown'}</span><span className="font-semibold">{d.count}</span></div>)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Hour-of-day pattern</h3>
          <div className="flex items-end gap-[2px] h-20">
            {breakdown.by_hour.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col justify-end" title={`${h.hour}h — ${h.count} taps`}>
                <div className="bg-gray-900 rounded-t" style={{ height: `${(h.count / peakHour) * 100}%`, minHeight: h.count > 0 ? '2px' : 0 }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>0</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

// Drill-down timeline for a single member
function MemberTimelineModal({ member, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['activity.timeline', member.url_id],
    queryFn: () => api.activity.timeline({ url_id: member.url_id, limit: 200 }),
  });
  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const timeline = data?.timeline || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{member.name} · activity timeline</DialogTitle></DialogHeader>
        {isLoading ? (
          <p className="py-10 text-center text-gray-500">Loading…</p>
        ) : timeline.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No events yet.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-3 py-2 px-3 border-b last:border-0 hover:bg-gray-50 rounded">
                <div className="text-xs text-gray-500 w-32 shrink-0">{formatDate(t.at)}</div>
                {t.kind === 'lead' ? (
                  <div className="flex-1">
                    <Badge className="bg-green-100 text-green-800 border-0 mr-2">lead</Badge>
                    <span className="font-medium">{t.name}</span>
                    <span className="text-gray-500 ml-2">{t.email || t.phone || t.company}</span>
                  </div>
                ) : (
                  <div className="flex-1">
                    <Badge variant="outline" className="mr-2">{t.event}</Badge>
                    {t.device && <span className="text-xs text-gray-600">{t.device}</span>}
                    {t.browser && <span className="text-xs text-gray-400"> · {t.browser}</span>}
                    {t.geo && <span className="text-xs text-gray-500"> · {t.geo}</span>}
                    {t.meta?.target && <span className="text-xs text-gray-700"> · clicked {t.meta.target}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
