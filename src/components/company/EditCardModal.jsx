import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCheck } from "lucide-react";
import { api } from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function EditCardModal({ card, onClose }) {
  const initial = useMemo(() => ({
    full_name: card.full_name || "",
    title: card.title || "",
    company_name: card.company_name || "",
    email: card.email || "",
    phone: card.phone || "",
    overview: card.overview || "",
    status: card.status === 'active' ? 'active' : (card.status || 'active'),
    is_active: card.is_active !== false,
    lead_capture_enabled: !!card.lead_capture_enabled,
    template: card.template || 'modern',
    font_style: card.font_style || 'sans',
    custom_color: card.custom_color || '#000000',
    social_links: card.social_links || {},
    messaging_links: card.messaging_links || {},
  }), [card.id]);

  const [formData, setFormData] = useState(initial);
  const nameChanged = (initial.full_name || '').trim().toLowerCase()
    !== (formData.full_name || '').trim().toLowerCase();

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => api.entities.DigitalCard.update(card.id, formData),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
      queryClient.invalidateQueries({ queryKey: ['urlStats'] });
      if (resp?.reassigned) {
        toast.success('Nuevo miembro asignado a esta tarjeta (historial guardado).');
      } else {
        toast.success('Perfil actualizado.');
      }
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Error al guardar.'),
  });

  const setSocial = (k, v) => setFormData((d) => ({ ...d, social_links: { ...d.social_links, [k]: v } }));
  const setMsg = (k, v) => setFormData((d) => ({ ...d, messaging_links: { ...d.messaging_links, [k]: v } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar tarjeta</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-3 rounded text-sm flex items-center justify-between">
          <div>
            <div><strong>Slug:</strong> <span className="font-mono">{card.permanent_slug}</span></div>
            <div className="text-gray-500 text-xs mt-1">El link y el QR no cambian aunque edites estos datos.</div>
          </div>
          {nameChanged && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              <UserCheck className="w-3 h-3" /> Se registrará como nuevo miembro
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Overview / Bio</Label>
            <Textarea
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <div className="font-medium text-sm">Lead Capture Mode</div>
              <div className="text-xs text-gray-500">Pide datos al visitante antes de entregar el vCard.</div>
            </div>
            <Switch
              checked={formData.lead_capture_enabled}
              onCheckedChange={(v) => setFormData({ ...formData, lead_capture_enabled: v })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Redes</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">LinkedIn</Label>
                <Input placeholder="https://linkedin.com/in/..." value={formData.social_links?.linkedin || ""} onChange={(e) => setSocial('linkedin', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Twitter</Label>
                <Input placeholder="https://twitter.com/..." value={formData.social_links?.twitter || ""} onChange={(e) => setSocial('twitter', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Instagram</Label>
                <Input placeholder="https://instagram.com/..." value={formData.social_links?.instagram || ""} onChange={(e) => setSocial('instagram', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Website</Label>
                <Input placeholder="https://..." value={formData.social_links?.website || ""} onChange={(e) => setSocial('website', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Mensajería</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">WhatsApp</Label>
                <Input placeholder="+1234567890" value={formData.messaging_links?.whatsapp || ""} onChange={(e) => setMsg('whatsapp', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Telegram</Label>
                <Input placeholder="@username" value={formData.messaging_links?.telegram || ""} onChange={(e) => setMsg('telegram', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado del link</Label>
            <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, is_active: v === 'active' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Si desactivas el link, el QR seguirá funcionando pero mostrará "Card Not Found".</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={updateMutation.isPending} className="bg-gray-900 hover:bg-gray-800">
              {updateMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
