import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Webhook, Zap, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const AVAILABLE_EVENTS = [
  { key: 'lead.captured', label: 'Lead capturado' },
];

export default function WebhooksPanel({ company }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(null);
  const queryClient = useQueryClient();

  const { data: hooks = [] } = useQuery({
    queryKey: ['webhooks', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Webhook.filter({ company_id: company.id }),
  });

  const remove = useMutation({
    mutationFn: (id) => api.entities.Webhook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook eliminado.');
    },
    onError: (err) => toast.error(err.message),
  });

  const test = useMutation({
    mutationFn: (id) => api.webhooks.test(id),
    onSuccess: (res) => {
      if (res.status && res.status < 400) toast.success(`Ping OK (${res.status})`);
      else toast.error(`Ping falló: ${res.error || res.status}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => api.entities.Webhook.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="w-5 h-5" /> Webhooks ({hooks.length})
            </h2>
            <p className="text-sm text-gray-500">Envía cada lead capturado a tu CRM, Zapier, Make o endpoint propio.</p>
          </div>
          <Button onClick={() => setCreating(true)} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo webhook
          </Button>
        </div>

        {hooks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Webhook className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No hay webhooks configurados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hooks.map((h) => (
              <div key={h.id} className="border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{h.name}</h3>
                      <Badge variant={h.is_active ? 'default' : 'secondary'}>{h.is_active ? 'activo' : 'pausado'}</Badge>
                      {(h.events || []).map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                    </div>
                    <p className="text-xs font-mono text-gray-500 truncate mt-1">{h.url}</p>
                    {h.last_fired_at && <p className="text-xs text-gray-400 mt-1">Último disparo: {new Date(h.last_fired_at).toLocaleString('es-MX')}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={h.is_active} onCheckedChange={(v) => toggle.mutate({ id: h.id, is_active: v })} />
                    <Button variant="outline" size="sm" onClick={() => test.mutate(h.id)} disabled={test.isPending} title="Enviar ping"><Zap className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeliveries(h)}>Deliveries</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(h)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => remove.mutate(h.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {(editing || creating) && (
        <WebhookFormModal
          company={company}
          webhook={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {showDeliveries && (
        <DeliveriesModal webhook={showDeliveries} onClose={() => setShowDeliveries(null)} />
      )}
    </Card>
  );
}

function WebhookFormModal({ company, webhook, onClose }) {
  const isEdit = !!webhook;
  const [form, setForm] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    events: webhook?.events || ['lead.captured'],
    secret: webhook?.secret || '',
    is_active: webhook?.is_active ?? true,
  });
  const [showSecret, setShowSecret] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => isEdit
      ? api.entities.Webhook.update(webhook.id, form)
      : api.entities.Webhook.create({ company_id: company.id, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(isEdit ? 'Webhook actualizado.' : 'Webhook creado.');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleEvent = (k) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(k) ? f.events.filter((e) => e !== k) : [...f.events, k],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar webhook' : 'Nuevo webhook'}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Zapier HubSpot" />
          </div>
          <div className="space-y-2">
            <Label>URL destino *</Label>
            <Input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://hooks.zapier.com/…" />
          </div>
          <div className="space-y-2">
            <Label>Eventos</Label>
            <div className="space-y-1">
              {AVAILABLE_EVENTS.map((e) => (
                <label key={e.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(e.key)} onChange={() => toggleEvent(e.key)} />
                  {e.label} <span className="text-xs text-gray-400">({e.key})</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secret (opcional)</Label>
            <div className="flex gap-2">
              <Input type={showSecret ? 'text' : 'password'} value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Dejar vacío para autogenerar" />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowSecret((s) => !s)}>
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Se usa para firmar cada request con HMAC SHA-256 en el header <code>X-Identra-Signature</code>.</p>
          </div>
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="font-medium text-sm">Webhook activo</div>
              <div className="text-xs text-gray-500">Desactiva para pausar el envío.</div>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-gray-900 hover:bg-gray-800">
              {mutation.isPending ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeliveriesModal({ webhook, onClose }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['deliveries', webhook.id],
    queryFn: () => api.webhooks.deliveries(webhook.id),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Deliveries · {webhook.name}</DialogTitle></DialogHeader>
        {isLoading ? (
          <p className="py-8 text-center text-gray-500">Cargando…</p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Aún no hay envíos registrados.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {data.map((d) => (
              <div key={d.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <Badge variant="outline" className="mr-2">{d.event}</Badge>
                    <span className={d.status_code && d.status_code < 400 ? 'text-green-600' : 'text-red-600'}>
                      {d.status_code || 'ERR'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(d.delivered_at).toLocaleString('es-MX')}</span>
                </div>
                {d.error && <p className="text-xs text-red-600 mt-1">{d.error}</p>}
                {d.response && <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto max-h-20">{d.response}</pre>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
