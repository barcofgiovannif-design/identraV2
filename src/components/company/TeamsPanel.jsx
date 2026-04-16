import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Users2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function TeamsPanel({ company, cards = [] }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', company?.id],
    enabled: !!company?.id,
    queryFn: () => api.entities.Team.filter({ company_id: company.id }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipo eliminado.');
    },
    onError: (err) => toast.error(err.message),
  });

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users2 className="w-5 h-5" /> Equipos ({teams.length})
            </h2>
            <p className="text-sm text-gray-500">Organiza a tus miembros por departamento, región o equipo.</p>
          </div>
          <Button onClick={() => setCreating(true)} className="bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" /> Nuevo equipo
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No hay equipos creados aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((t) => (
              <div key={t.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {t.parent_team_id && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <Badge variant="outline">{t.profile_count || 0} miembros</Badge>
                    {t.parent_team_id && <span className="text-xs text-gray-500">sub-equipo de {teamMap[t.parent_team_id]?.name || '—'}</span>}
                    {t.children_count > 0 && <Badge variant="outline">{t.children_count} sub-equipos</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAssigning(t)}>Asignar miembros</Button>
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
        <TeamFormModal
          company={company}
          team={editing}
          teams={teams}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {assigning && (
        <AssignMembersModal
          team={assigning}
          cards={cards}
          onClose={() => setAssigning(null)}
        />
      )}
    </Card>
  );
}

function TeamFormModal({ company, team, teams, onClose }) {
  const isEdit = !!team;
  const [form, setForm] = useState({ name: team?.name || '', parent_team_id: team?.parent_team_id || '' });
  const queryClient = useQueryClient();
  const parents = teams.filter((t) => t.id !== team?.id);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, parent_team_id: form.parent_team_id || null };
      if (isEdit) return api.entities.Team.update(team.id, payload);
      return api.entities.Team.create({ company_id: company.id, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(isEdit ? 'Equipo actualizado.' : 'Equipo creado.');
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Editar equipo' : 'Nuevo equipo'}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ventas NA / Directivos / Marketing" />
          </div>
          <div className="space-y-2">
            <Label>Sub-equipo de (opcional)</Label>
            <Select value={form.parent_team_id || 'none'} onValueChange={(v) => setForm({ ...form, parent_team_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="— ninguno —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— ninguno —</SelectItem>
                {parents.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
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

function AssignMembersModal({ team, cards, onClose }) {
  const [selected, setSelected] = useState(new Set(cards.filter((c) => c.team_id === team.id).map((c) => c.active_profile_id)));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.teams.assign(team.id, Array.from(selected)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
      toast.success(`${res.assigned} miembros asignados a ${team.name}.`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Asignar miembros a {team.name}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {cards.filter((c) => c.active_profile_id).map((c) => (
            <label key={c.active_profile_id} className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={selected.has(c.active_profile_id)} onChange={() => toggle(c.active_profile_id)} />
              <div className="flex-1">
                <div className="font-medium">{c.full_name}</div>
                <div className="text-xs text-gray-500">{c.title || '—'} · /{c.permanent_slug}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-gray-900 hover:bg-gray-800" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Asignando…' : `Asignar ${selected.size} miembro(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
