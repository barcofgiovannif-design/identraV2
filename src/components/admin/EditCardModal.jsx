import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function EditCardModal({ card, companies, onClose }) {
  const [formData, setFormData] = useState({
    full_name: card.full_name || "",
    title: card.title || "",
    company_name: card.company_name || "",
    email: card.email || "",
    phone: card.phone || "",
    overview: card.overview || "",
    status: card.status || "active",
    social_links: card.social_links || {},
    messaging_links: card.messaging_links || {}
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DigitalCard.update(card.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCards']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const updateSocialLink = (platform, value) => {
    setFormData({
      ...formData,
      social_links: { ...formData.social_links, [platform]: value }
    });
  };

  const updateMessagingLink = (platform, value) => {
    setFormData({
      ...formData,
      messaging_links: { ...formData.messaging_links, [platform]: value }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Digital Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-3 rounded text-sm">
            <strong>Slug:</strong> <span className="font-mono">{card.permanent_slug}</span>
            <br />
            <strong>Company:</strong> {companies.find(c => c.id === card.company_id)?.company_name}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Overview / Bio</Label>
            <Textarea
              value={formData.overview}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Social Links</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">LinkedIn</Label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={formData.social_links?.linkedin || ""}
                  onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Twitter</Label>
                <Input
                  placeholder="https://twitter.com/..."
                  value={formData.social_links?.twitter || ""}
                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Instagram</Label>
                <Input
                  placeholder="https://instagram.com/..."
                  value={formData.social_links?.instagram || ""}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Website</Label>
                <Input
                  placeholder="https://..."
                  value={formData.social_links?.website || ""}
                  onChange={(e) => updateSocialLink('website', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Messaging</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">WhatsApp</Label>
                <Input
                  placeholder="+1234567890"
                  value={formData.messaging_links?.whatsapp || ""}
                  onChange={(e) => updateMessagingLink('whatsapp', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Telegram</Label>
                <Input
                  placeholder="@username"
                  value={formData.messaging_links?.telegram || ""}
                  onChange={(e) => updateMessagingLink('telegram', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>

          {updateMutation.isError && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              Error: {updateMutation.error?.message || 'Failed to update card'}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}