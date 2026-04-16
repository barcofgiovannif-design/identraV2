import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Cpu, Link2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  inventory: 'bg-gray-100 text-gray-700',
  assigned:  'bg-blue-100 text-blue-700',
  shipped:   'bg-green-100 text-green-700',
  lost:      'bg-red-100 text-red-700',
  replaced:  'bg-amber-100 text-amber-700',
};

export default function HardwareTable({ companies = [] }) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();

  const { data: hardware = [], isLoading } = useQuery({
    queryKey: ['hardware'],
    queryFn: () => api.entities.HardwareCard.list(),
  });

  const companyMap = useMemo(() => {
    const m = {};
    for (const c of companies) m[c.id] = c.company_name;
    return m;
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return hardware.filter((h) => {
      if (companyFilter && h.company_id !== companyFilter) return false;
      if (statusFilter && h.status !== statusFilter) return false;
      if (!q) return true;
      return [h.nfc_uid, h.batch_number, h.url?.short_code, companyMap[h.company_id]]
        .some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [hardware, search, companyFilter, statusFilter, companyMap]);

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.HardwareCard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
      toast.success('Tarjeta eliminada.');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.entities.HardwareCard.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> Inventario NFC ({hardware.length})
            </h2>
            <p className="text-sm text-gray-500">Registra lotes de tarjetas, asigna UIDs y gestiona envíos.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="UID, lote, cliente…" className="pl-9" />
            </div>
            <select className="border border-gray-200 rounded-md px-2 text-sm" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">Todos los clientes</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
            <select className="border border-gray-200 rounded-md px-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="inventory">Inventario</option>
              <option value="assigned">Asignada</option>
              <option value="shipped">Enviada</option>
              <option value="lost">Perdida</option>
              <option value="replaced">Reemplazada</option>
            </select>
            <Button onClick={() => setAdding(true)} className="bg-gray-900 hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" /> Añadir lote
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Cpu className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No hay tarjetas físicas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-2 pr-3">NFC UID</th>
                  <th className="py-2 pr-3">Lote</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">URL asignada</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Enviada</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-3 font-mono text-xs">{h.nfc_uid || '—'}</td>
                    <td className="py-3 pr-3">{h.batch_number || '—'}</td>
                    <td className="py-3 pr-3">{companyMap[h.company_id] || h.company_id.slice(0, 6)}</td>
                    <td className="py-3 pr-3">
                      {h.url ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono">
                          <Link2 className="w-3 h-3" />{h.url.short_code}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <Select
                        value={h.status}
                        onValueChange={(v) => updateStatus.mutate({ id: h.id, status: v })}
                      >
                        <SelectTrigger className={`h-7 text-xs border-0 rounded-full px-3 ${STATUS_COLORS[h.status] || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inventory">Inventario</SelectItem>
                          <SelectItem value="assigned">Asignada</SelectItem>
                          <SelectItem value="shipped">Enviada</SelectItem>
                          <SelectItem value="lost">Perdida</SelectItem>
                          <SelectItem value="replaced">Reemplazada</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-3 text-gray-500">{formatDate(h.shipped_at)}</td>
                    <td className="py-3 pr-3">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMutation.mutate(h.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {adding && <AddHardwareModal companies={companies} onClose={() => setAdding(false)} />}
    </Card>
  );
}

function AddHardwareModal({ companies, onClose }) {
  const [form, setForm] = useState({
    company_id: companies[0]?.id || '',
    batch_number: '',
    quantity: 10,
    uids: '',
  });
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const uids = form.uids
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const quantity = uids.length > 0 ? uids.length : Math.max(0, parseInt(form.quantity, 10) || 0);
      if (!form.company_id || quantity === 0) throw new Error('Cliente y cantidad son requeridos.');
      const results = [];
      for (let i = 0; i < quantity; i++) {
        const nfc_uid = uids[i] || null;
        const card = await api.entities.HardwareCard.create({
          company_id: form.company_id,
          batch_number: form.batch_number || null,
          nfc_uid,
          status: 'inventory',
        });
        results.push(card);
      }
      return results;
    },
    onSuccess: (arr) => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] });
      toast.success(`${arr.length} tarjeta(s) añadidas al inventario.`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Añadir lote al inventario</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número de lote</Label>
            <Input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="Ej: LOT-2026-001" />
          </div>
          <div className="space-y-2">
            <Label>Cantidad (si no pegas UIDs)</Label>
            <Input type="number" min={1} max={500} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>NFC UIDs (uno por línea o separados por coma)</Label>
            <textarea
              className="w-full border rounded-lg p-2 text-sm font-mono"
              rows={4}
              value={form.uids}
              onChange={(e) => setForm({ ...form, uids: e.target.value })}
              placeholder="04A1B2C3D4E5F6&#10;04A1B2C3D4E5F7"
            />
            <p className="text-xs text-gray-500">Si pegas UIDs, la cantidad se deduce de la cantidad de líneas.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submit.isPending} className="bg-gray-900 hover:bg-gray-800">
              {submit.isPending ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
