import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export default function BrandingSettings({ company }) {
  const [brandColor, setBrandColor] = useState(company.brand_color || "#000000");
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateBrandingMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(company.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['company']);
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateBrandingMutation.mutate({ logo_url: file_url });
    } catch (error) {
      alert("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleColorSave = () => {
    updateBrandingMutation.mutate({ brand_color: brandColor });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            {company.logo_url && (
              <img src={company.logo_url} alt="Company logo" className="w-16 h-16 object-contain rounded-lg border" />
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button variant="outline" disabled={uploading} className="rounded-lg" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Brand Color */}
        <div className="space-y-2">
          <Label>Brand Color</Label>
          <div className="flex items-center gap-4">
            <Input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-20 h-12 cursor-pointer rounded-lg"
            />
            <Input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 rounded-lg"
            />
            <Button
              onClick={handleColorSave}
              disabled={updateBrandingMutation.isPending}
              className="bg-gray-900 hover:bg-gray-800 rounded-lg"
            >
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}