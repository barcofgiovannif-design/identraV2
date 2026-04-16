import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, Mail, Phone, Building2 } from "lucide-react";

export default function LeadsPanel({ company, cards = [] }) {
  const [search, setSearch] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Lead.filter({ company_id: company.id }),
  });

  const profileNameByUrl = useMemo(() => {
    const m = {};
    for (const c of cards) m[c.id] = c.full_name || '—';
    return m;
  }, [cards]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (urlFilter && l.url_id !== urlFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.notes]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [leads, search, urlFilter]);

  const formatDate = (d) => d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const exportCsv = () => {
    const header = ['captured_at', 'name', 'email', 'phone', 'company', 'card', 'notes'];
    const rows = filtered.map((l) => [
      new Date(l.captured_at).toISOString(),
      l.name || '',
      l.email || '',
      l.phone || '',
      l.company || '',
      profileNameByUrl[l.url_id] || l.url_id,
      (l.notes || '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${company.company_name.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" /> Leads capturados ({leads.length})
            </h2>
            <p className="text-sm text-gray-500">Contactos de visitantes que completaron el formulario de Lead Capture.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email..." className="pl-9" />
            </div>
            <select
              className="border border-gray-200 rounded-md px-2 text-sm"
              value={urlFilter}
              onChange={(e) => setUrlFilter(e.target.value)}
            >
              <option value="">Todas las tarjetas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name || c.permanent_slug}</option>
              ))}
            </select>
            <Button onClick={exportCsv} disabled={filtered.length === 0} className="bg-gray-900 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{leads.length === 0 ? 'Aún no hay leads capturados.' : 'No hay resultados para el filtro.'}</p>
            <p className="text-sm">Activa Lead Capture Mode en una tarjeta para empezar a capturar contactos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Contacto</th>
                  <th className="py-2 pr-3">Email / Teléfono</th>
                  <th className="py-2 pr-3">Empresa</th>
                  <th className="py-2 pr-3">Tarjeta</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-3 text-gray-500 whitespace-nowrap">{formatDate(l.captured_at)}</td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-gray-900">{l.name || '—'}</div>
                      {l.notes && <div className="text-xs text-gray-500 truncate max-w-xs">{l.notes}</div>}
                    </td>
                    <td className="py-3 pr-3">
                      {l.email && <div className="flex items-center gap-1 text-gray-700"><Mail className="w-3 h-3" />{l.email}</div>}
                      {l.phone && <div className="flex items-center gap-1 text-gray-500 text-xs mt-1"><Phone className="w-3 h-3" />{l.phone}</div>}
                    </td>
                    <td className="py-3 pr-3">
                      {l.company ? (<div className="flex items-center gap-1 text-gray-700"><Building2 className="w-3 h-3" />{l.company}</div>) : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline">{profileNameByUrl[l.url_id] || l.url_id.slice(0, 6)}</Badge>
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
