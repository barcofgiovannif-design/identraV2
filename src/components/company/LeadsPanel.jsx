import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Users, Mail, Phone, Building2, Calendar, StickyNote } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES = [
  { value: 'new', label: 'New', tone: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', tone: 'bg-amber-100 text-amber-700' },
  { value: 'qualified', label: 'Qualified', tone: 'bg-purple-100 text-purple-700' },
  { value: 'closed_won', label: 'Closed · won', tone: 'bg-green-100 text-green-700' },
  { value: 'closed_lost', label: 'Closed · lost', tone: 'bg-gray-200 text-gray-600' },
];

const DATE_PRESETS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
];

export default function LeadsPanel({ company, cards = [] }) {
  const [search, setSearch] = useState("");
  const [activeMember, setActiveMember] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [detailLead, setDetailLead] = useState(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Lead.filter({ company_id: company.id }),
  });

  const cardByUrlId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  const dateFiltered = useMemo(() => {
    if (datePreset === 'all') return leads;
    if (datePreset === 'custom') {
      const from = customFrom ? new Date(customFrom + 'T00:00:00') : null;
      const to = customTo ? new Date(customTo + 'T23:59:59') : null;
      return leads.filter((l) => {
        const d = new Date(l.captured_at);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    const days = parseInt(datePreset, 10);
    const since = Date.now() - days * 86400000;
    return leads.filter((l) => new Date(l.captured_at).getTime() >= since);
  }, [leads, datePreset, customFrom, customTo]);

  const leadsByUrl = useMemo(() => {
    const map = {};
    for (const l of dateFiltered) (map[l.url_id] ||= []).push(l);
    return map;
  }, [dateFiltered]);

  const members = useMemo(() => {
    return cards
      .filter((c) => c.active_profile_id)
      .map((c) => ({
        url_id: c.id,
        name: c.full_name || c.permanent_slug,
        slug: c.permanent_slug,
        count: leadsByUrl[c.id]?.length || 0,
      }))
      .filter((m) => m.count > 0 || activeMember === m.url_id)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [cards, leadsByUrl, activeMember]);

  const visibleLeads = useMemo(() => {
    const source = activeMember === 'all' ? dateFiltered : (leadsByUrl[activeMember] || []);
    const q = search.toLowerCase();
    return source.filter((l) => {
      if (statusFilter !== 'all' && (l.status || 'new') !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.notes]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [dateFiltered, leadsByUrl, activeMember, search, statusFilter]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.entities.Lead.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => toast.error(err.message),
  });

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const exportCsv = () => {
    if (visibleLeads.length === 0) return;
    const header = ['captured_at', 'status', 'name', 'email', 'phone', 'company', 'card', 'notes'];
    const body = visibleLeads.map((l) => [
      new Date(l.captured_at).toISOString(),
      l.status || 'new',
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || '',
      cardByUrlId[l.url_id]?.full_name || l.url_id,
      (l.notes || '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...body]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffix = activeMember === 'all' ? 'all' : (members.find((m) => m.url_id === activeMember)?.slug || 'member');
    a.href = url;
    a.download = `leads-${company.company_name.replace(/\s+/g, '-')}-${suffix}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" /> Leads ({dateFiltered.length})
            </h2>
            <p className="text-sm text-gray-500">Contacts from visitors who completed the Lead Capture form.</p>
          </div>
          <Button onClick={exportCsv} disabled={visibleLeads.length === 0} className="bg-gray-900 hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-40"><Calendar className="w-3 h-3 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {datePreset === 'custom' && (
            <>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
            </>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No leads captured yet.</p>
            <p className="text-sm">Turn on Lead Capture Mode on a card to start collecting contacts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <div className="border rounded-lg overflow-hidden self-start">
              <button
                onClick={() => setActiveMember('all')}
                className={`w-full text-left px-3 py-2 text-sm border-b ${activeMember === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">All members</span>
                  <Badge variant={activeMember === 'all' ? 'secondary' : 'outline'}>{dateFiltered.length}</Badge>
                </div>
              </button>
              <div className="max-h-[500px] overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.url_id}
                    onClick={() => setActiveMember(m.url_id)}
                    className={`w-full text-left px-3 py-2 text-sm border-b last:border-0 ${activeMember === m.url_id ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate">{m.name}</div>
                        <div className={`text-xs truncate ${activeMember === m.url_id ? 'text-gray-300' : 'text-gray-500'}`}>/{m.slug}</div>
                      </div>
                      <Badge variant={activeMember === m.url_id ? 'secondary' : 'outline'} className="shrink-0">{m.count}</Badge>
                    </div>
                  </button>
                ))}
                {members.length === 0 && (
                  <p className="text-xs text-gray-400 p-3">No members with leads in this window.</p>
                )}
              </div>
            </div>

            <div>
              {visibleLeads.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <p>No leads for this selection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider bg-gray-50">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Contact</th>
                        <th className="py-2 px-3">Email / Phone</th>
                        <th className="py-2 px-3">Status</th>
                        {activeMember === 'all' && <th className="py-2 px-3">Card</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.map((l) => (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailLead(l)}>
                          <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{formatDate(l.captured_at)}</td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-900">{l.name || '—'}</div>
                            {l.company && <div className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{l.company}</div>}
                          </td>
                          <td className="py-3 px-3">
                            {l.email && <div className="flex items-center gap-1 text-gray-700 text-xs"><Mail className="w-3 h-3" />{l.email}</div>}
                            {l.phone && <div className="flex items-center gap-1 text-gray-500 text-xs mt-1"><Phone className="w-3 h-3" />{l.phone}</div>}
                          </td>
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <Select value={l.status || 'new'} onValueChange={(v) => statusMutation.mutate({ id: l.id, status: v })}>
                              <SelectTrigger className={`h-7 text-xs border-0 rounded-full px-3 w-auto ${STATUSES.find((s) => s.value === (l.status || 'new'))?.tone || ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          {activeMember === 'all' && (
                            <td className="py-3 px-3">
                              <Badge variant="outline" className="text-xs">{cardByUrlId[l.url_id]?.full_name || l.url_id.slice(0, 6)}</Badge>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {detailLead && (
        <LeadDetailDrawer
          lead={detailLead}
          card={cardByUrlId[detailLead.url_id]}
          onClose={() => setDetailLead(null)}
        />
      )}
    </Card>
  );
}

function LeadDetailDrawer({ lead, card, onClose }) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState(lead.status || 'new');
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: () => api.entities.Lead.update(lead.id, { notes, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated.');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{lead.name || 'Lead details'}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
            <div>
              <div className="text-xs text-gray-500">Captured</div>
              <div>{new Date(lead.captured_at).toLocaleString('en-US')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Card</div>
              <div>{card?.full_name || lead.url_id.slice(0, 8)}</div>
            </div>
            {lead.email && (
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</a>
              </div>
            )}
            {lead.company && (
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Their company</div>
                <div>{lead.company}</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><StickyNote className="w-3 h-3" />Notes</label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Follow-up notes, next steps, meeting reminders…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="bg-gray-900 hover:bg-gray-800" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
