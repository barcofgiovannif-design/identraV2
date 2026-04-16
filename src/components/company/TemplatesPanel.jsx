import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Layers, Lock } from "lucide-react";
import toast from "react-hot-toast";

const LOCKABLE_FIELDS = [
  { key: 'full_name', label: 'Nombre' },
  { key: 'title', label: 'Cargo' },
  { key: 'company_name', label: 'Empresa (texto)' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'bio', label: 'Bio' },
  { key: 'photo_url', label: 'Foto' },
  { key: 'social_links', label: 'Redes sociales' },
  { key: 'messaging_links', label: 'Mensajería' },
];

export default function TemplatesPanel({ company }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Template.filter({ company_id: company.id }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Plantilla eliminada.');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Plantillas ({templates.length})
            </h2>
            <p className="text-sm text-gray-500">Define campos comunes y bloqueos para varios perfiles a la vez.</p>
          </div>
          <Button onClick={() => setCreating(true)} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" /> Nueva plantilla
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Cargando…</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>Aún no creaste plantillas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <Badge variant="outline">{t.profile_count || 0} perfiles</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(t.locked_fields || []).map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        <Lock className="w-3 h-3" /> {LOCKABLE_FIELDS.find((x) => x.key === f)?.label || f}
                      </span>
                    ))}
                    {t.common_links && Object.keys(t.common_links).length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {Object.keys(t.common_links).length} links comunes
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(t)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => removeMutation.mutate(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {(editing || creating) && (
        <TemplateFormModal
          company={company}
          template={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </Card>
  );
}

function TemplateFormModal({ company, template, onClose }) {
  const isEdit = !!template;
  const [form, setForm] = useState({
    name: template?.name || '',
    common_links: template?.common_links || {},
    locked_fields: template?.locked_fields || [],
    design_settings: template?.design_settings || { template: 'modern', font_style: 'sans', custom_color: '#000000' },
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return api.entities.Template.update(template.id, form);
      return api.entities.Template.create({ company_id: company.id, ...form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
      toast.success(isEdit ? 'Plantilla actualizada.' : 'Plantilla creada.');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleLock = (key) => {
    setForm((f) => ({
      ...f,
      locked_fields: f.locked_fields.includes(key)
        ? f.locked_fields.filter((x) => x !== key)
        : [...f.locked_fields, key],
    }));
  };
  const setCommon = (k, v) => setForm((f) => ({ ...f, common_links: { ...f.common_links, [k]: v } }));
  const setDesign = (k, v) => setForm((f) => ({ ...f, design_settings: { ...f.design_settings, [k]: v } }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle></DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ventas / Directivos / Marketing..." />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Links comunes</Label>
            <p className="text-xs text-gray-500">Estos se aplican a todos los perfiles con esta plantilla y reemplazan el valor individual.</p>
            <div className="grid grid-cols-2 gap-3">
              {['linkedin', 'twitter', 'instagram', 'website'].map((k) => (
                <div key={k} className="space-y-1">
                  <Label className="text-sm text-gray-600 capitalize">{k}</Label>
                  <Input value={form.common_links?.[k] || ''} onChange={(e) => setCommon(k, e.target.value)} placeholder={`https://${k}.com/...`} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Campos bloqueados para editar por el miembro</Label>
            <div className="grid grid-cols-3 gap-2">
              {LOCKABLE_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.locked_fields.includes(f.key)}
                    onChange={() => toggleLock(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Diseño por defecto</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Template</Label>
                <Select value={form.design_settings.template} onValueChange={(v) => setDesign('template', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Font</Label>
                <Select value={form.design_settings.font_style} onValueChange={(v) => setDesign('font_style', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Color</Label>
                <Input type="color" value={form.design_settings.custom_color} onChange={(e) => setDesign('custom_color', e.target.value)} />
              </div>
            </div>
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
