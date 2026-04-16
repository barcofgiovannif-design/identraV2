import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Users, Mail, Phone, Building2, Filter } from "lucide-react";

export default function AdminLeadsPanel({ companies = [] }) {
  const [companyId, setCompanyId] = useState("all");
  const [cardId, setCardId] = useState("all");
  const [search, setSearch] = useState("");
  const [since, setSince] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['adminLeads', companyId, since],
    queryFn: () => api.entities.Lead.filter({
      ...(companyId !== 'all' ? { company_id: companyId } : {}),
      ...(since ? { since } : {}),
    }),
  });

  // When filtering by company, fetch its cards for the second filter.
  const { data: cards = [] } = useQuery({
    queryKey: ['adminLeadsCards', companyId],
    enabled: companyId !== 'all',
    queryFn: () => api.entities.Url.filter({ company_id: companyId }),
  });

  const companyMap = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.company_name])), [companies]);
  const cardMap = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (cardId !== 'all' && l.url_id !== cardId) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.notes]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [leads, cardId, search]);

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ['captured_at', 'company', 'card', 'name', 'email', 'phone', 'lead_company', 'notes'];
    const body = filtered.map((l) => [
      new Date(l.captured_at).toISOString(),
      companyMap[l.company_id] || l.company_id,
      (l.url && l.url.active_profile?.full_name) || cardMap[l.url_id]?.full_name || l.url_id,
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || '',
      (l.notes || '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...body]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-admin-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" /> All captured leads ({leads.length})
            </h2>
            <p className="text-sm text-gray-500">Filter by company and team member across the entire platform.</p>
          </div>
          <Button onClick={exportCsv} disabled={filtered.length === 0} className="bg-gray-900 hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1"><Filter className="w-3 h-3" />Company</Label>
            <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setCardId('all'); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Team member</Label>
            <Select value={cardId} onValueChange={setCardId} disabled={companyId === 'all'}>
              <SelectTrigger><SelectValue placeholder={companyId === 'all' ? 'Select a company first' : 'All members'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                {cards.filter((c) => c.active_profile_id).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name || c.permanent_slug}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Since</Label>
            <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Search</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name, email…" className="pl-9" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border rounded-lg">
            <p>No leads matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider bg-gray-50">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Card</th>
                  <th className="py-2 px-3">Contact</th>
                  <th className="py-2 px-3">Email / Phone</th>
                  <th className="py-2 px-3">Their company</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{formatDate(l.captured_at)}</td>
                    <td className="py-3 px-3"><Badge variant="outline">{companyMap[l.company_id] || '—'}</Badge></td>
                    <td className="py-3 px-3">
                      <span className="text-xs">{(l.url && l.url.active_profile?.full_name) || cardMap[l.url_id]?.full_name || '—'}</span>
                      <div className="text-[10px] font-mono text-gray-400">/{l.url?.short_code || l.url_id.slice(0, 6)}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900">{l.name || '—'}</td>
                    <td className="py-3 px-3">
                      {l.email && <div className="flex items-center gap-1 text-gray-700"><Mail className="w-3 h-3" />{l.email}</div>}
                      {l.phone && <div className="flex items-center gap-1 text-gray-500 text-xs mt-1"><Phone className="w-3 h-3" />{l.phone}</div>}
                    </td>
                    <td className="py-3 px-3">
                      {l.company ? (<div className="flex items-center gap-1 text-gray-700"><Building2 className="w-3 h-3" />{l.company}</div>) : '—'}
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
