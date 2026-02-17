import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function CreateCardModal({ company, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    title: "",
    phone: "",
    email: "",
    overview: "",
    linkedin: "",
    twitter: "",
    whatsapp: ""
  });

  const queryClient = useQueryClient();

  const createCardMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke("createDigitalCard", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['digitalCards']);
      onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCardMutation.mutate({
      company_id: company.id,
      full_name: formData.full_name,
      title: formData.title,
      company_name: company.company_name,
      phone: formData.phone,
      email: formData.email,
      overview: formData.overview,
      social_links: {
        linkedin: formData.linkedin,
        twitter: formData.twitter
      },
      messaging_links: {
        whatsapp: formData.whatsapp
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Digital Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview">Professional Overview</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                rows={3}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Social & Messaging</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter/X URL</Label>
                <Input
                  id="twitter"
                  placeholder="https://twitter.com/..."
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                placeholder="+1234567890"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCardMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 rounded-lg"
            >
              {createCardMutation.isPending ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}