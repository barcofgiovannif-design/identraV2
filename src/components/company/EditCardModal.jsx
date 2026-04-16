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
  const [confirmReassign, setConfirmReassign] = useState(false);
  const nameChanged = (initial.full_name || '').trim().toLowerCase()
    !== (formData.full_name || '').trim().toLowerCase();
  const hadPreviousName = !!(initial.full_name || '').trim();

  const queryClient = useQueryClient();

  const submit = (extra = {}) => updateMutation.mutate({ ...formData, ...extra });

  const updateMutation = useMutation({
    mutationFn: async (payload) => api.entities.DigitalCard.update(card.id, payload),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['digitalCards'] });
      queryClient.invalidateQueries({ queryKey: ['urlStats'] });
      queryClient.invalidateQueries({ queryKey: ['activity.byMember'] });
      if (resp?.reassigned) {
        toast.success('New member assigned to this card — previous profile archived.');
      } else {
        toast.success('Profile updated.');
      }
      setConfirmReassign(false);
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Error saving.'),
  });

  const setSocial = (k, v) => setFormData((d) => ({ ...d, social_links: { ...d.social_links, [k]: v } }));
  const setMsg = (k, v) => setFormData((d) => ({ ...d, messaging_links: { ...d.messaging_links, [k]: v } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // If the name changed AND there was a previous name, always confirm intent.
    if (nameChanged && hadPreviousName) {
      setConfirmReassign(true);
      return;
    }
    submit();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-3 rounded text-sm flex items-center justify-between">
          <div>
            <div><strong>Slug:</strong> <span className="font-mono">{card.permanent_slug}</span></div>
            <div className="text-gray-500 text-xs mt-1">The link and QR stay the same even when you edit these fields.</div>
          </div>
          {nameChanged && hadPreviousName && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              <UserCheck className="w-3 h-3" /> Name changed — you'll confirm on save
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
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
              <Label>Phone</Label>
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
              <div className="text-xs text-gray-500">Ask the visitor for their info before handing out the vCard.</div>
            </div>
            <Switch
              checked={formData.lead_capture_enabled}
              onCheckedChange={(v) => setFormData({ ...formData, lead_capture_enabled: v })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Socials</Label>
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
            <Label className="text-base font-semibold">Messaging</Label>
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
            <Label>Link status</Label>
            <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, is_active: v === 'active' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">If you disable the link, the QR keeps scanning but will show "Card Not Found".</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending} className="bg-gray-900 hover:bg-gray-800">
              {updateMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {confirmReassign && (
        <Dialog open onOpenChange={() => setConfirmReassign(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Name changed — confirm action</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p>You changed the name from:</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <div>Before: <span className="font-bold">{initial.full_name || '(empty)'}</span></div>
                <div>After:  <span className="font-bold">{formData.full_name || '(empty)'}</span></div>
              </div>
              <p className="text-gray-600">Is this a new team member replacing the previous one, or just a typo fix?</p>
              <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                <li><b>New person</b> archives the old profile (leads stay linked to the old name) and starts a fresh profile under the same card/URL.</li>
                <li><b>Typo fix</b> renames in place — historical leads/activity stay attributed to this (renamed) profile.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <Button
                className="bg-gray-900 hover:bg-gray-800"
                disabled={updateMutation.isPending}
                onClick={() => submit()}
              >
                New person — archive the old profile
              </Button>
              <Button
                variant="outline"
                disabled={updateMutation.isPending}
                onClick={() => submit({ force_update: true })}
              >
                Typo fix — rename in place
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReassign(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
