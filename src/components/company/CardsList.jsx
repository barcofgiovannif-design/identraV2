import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { QrCode, ExternalLink, Edit2, Search, Copy, Check, Share2, Mail, MessageCircle } from "lucide-react";
import CardFormModal from "./CardFormModal";
import toast from "react-hot-toast";

const SORTS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'taps_desc', label: 'Taps (highest)' },
  { value: 'taps_asc', label: 'Taps (lowest)' },
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
];

export default function CardsList({ cards, company, isLoading }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState('taps_desc');
  const [copied, setCopied] = useState(null);

  const publicBase = typeof window !== 'undefined' ? window.location.origin : '';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let out = cards.filter((c) => {
      if (statusFilter === 'active' && !c.active_profile_id) return false;
      if (statusFilter === 'unassigned' && c.active_profile_id) return false;
      if (statusFilter === 'inactive' && c.is_active !== false) return false;
      if (!q) return true;
      return [c.full_name, c.title, c.permanent_slug, c.email]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
    const sorters = {
      name_asc: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''),
      name_desc: (a, b) => (b.full_name || '').localeCompare(a.full_name || ''),
      taps_desc: (a, b) => (b.tap_count || 0) - (a.tap_count || 0),
      taps_asc: (a, b) => (a.tap_count || 0) - (b.tap_count || 0),
      created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    };
    out = [...out].sort(sorters[sort]);
    return out;
  }, [cards, search, statusFilter, sort]);

  const counts = useMemo(() => {
    const a = cards.filter((c) => c.active_profile_id).length;
    const u = cards.filter((c) => !c.active_profile_id).length;
    const i = cards.filter((c) => c.is_active === false).length;
    return { all: cards.length, active: a, unassigned: u, inactive: i };
  }, [cards]);

  const handleDownloadQR = async (card) => {
    if (!card.qr_code_url) return;
    try {
      const res = await fetch(card.qr_code_url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(card.full_name || card.permanent_slug).replace(/\s+/g, '-')}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      window.open(card.qr_code_url, '_blank');
    }
  };

  const publicLinkFor = (card) => `${publicBase}/Card/${card.permanent_slug}`;

  const copyLink = async (card) => {
    const link = publicLinkFor(card);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(card.id);
      toast.success('Public link copied.');
      setTimeout(() => setCopied((x) => (x === card.id ? null : x)), 1500);
    } catch {
      window.prompt('Copy this link:', link);
    }
  };

  const shareViaWhatsApp = (card) => {
    const name = card.full_name || 'our card';
    const text = `Here's ${name}'s digital business card: ${publicLinkFor(card)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareViaEmail = (card) => {
    const name = card.full_name || 'Digital card';
    const subject = `${name} — digital business card`;
    const body = `Hi,\n\nHere is ${name}'s digital business card — all their contact info in one link:\n\n${publicLinkFor(card)}\n\nTap "Save to Contacts" at the bottom to add them to your phone.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Loading cards…</p>
        </CardContent>
      </Card>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-2">No cards created yet</p>
          <p className="text-sm text-gray-500">Create your first digital card to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cards</h2>
            <p className="text-sm text-gray-500">
              {counts.active} active · {counts.unassigned} unassigned{counts.inactive ? ` · ${counts.inactive} disabled` : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, title, slug…" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                <SelectItem value="active">Active ({counts.active})</SelectItem>
                <SelectItem value="unassigned">Unassigned ({counts.unassigned})</SelectItem>
                <SelectItem value="inactive">Disabled ({counts.inactive})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No cards match the current filters.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((card) => {
              const assigned = !!card.active_profile_id;
              const displayName = assigned ? (card.full_name || '—') : 'Unassigned';
              const initial = (displayName[0] || '?').toUpperCase();
              const disabled = card.is_active === false;
              return (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-4 border rounded-xl hover:border-gray-300 transition-colors ${disabled ? 'bg-gray-50 opacity-70' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 ${assigned ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                      <p className="text-sm text-gray-600 truncate">{card.title || '—'}</p>
                      <div className="flex gap-2 mt-1 items-center flex-wrap">
                        {disabled ? (
                          <Badge variant="outline" className="text-xs text-red-700 border-red-200">disabled</Badge>
                        ) : assigned ? (
                          <Badge className="text-xs bg-green-100 text-green-800 border-0">active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-200">unassigned</Badge>
                        )}
                        <span className="text-xs font-mono text-gray-400">/{card.permanent_slug}</span>
                        {typeof card.tap_count === 'number' && (
                          <span className="text-xs text-gray-500">· {card.tap_count} taps</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/Card/${card.permanent_slug}`, '_blank')} className="rounded-lg" title="View public card">
                      <ExternalLink className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-lg" title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(card)}>
                          {copied === card.id ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                          Copy public link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareViaWhatsApp(card)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Share on WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareViaEmail(card)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Share via email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownloadQR(card)}>
                          <QrCode className="w-4 h-4 mr-2" />
                          Download QR (PNG)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={() => setEditing(card)} className="rounded-lg" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {editing && <CardFormModal card={editing} company={company} onClose={() => setEditing(null)} />}
    </Card>
  );
}
