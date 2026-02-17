import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CardCustomization({ formData, setFormData }) {
  const templates = [
    { value: "modern", label: "Modern", description: "Clean design with bold colors" },
    { value: "classic", label: "Classic", description: "Traditional business card style" },
    { value: "minimal", label: "Minimal", description: "Simple and elegant" },
    { value: "gradient", label: "Gradient", description: "Eye-catching gradient background" }
  ];

  const fonts = [
    { value: "sans", label: "Sans Serif", description: "Modern and clean" },
    { value: "serif", label: "Serif", description: "Classic and professional" },
    { value: "mono", label: "Monospace", description: "Tech and modern" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Card Customization</h3>
        <p className="text-sm text-gray-600 mb-6">
          Personalize the appearance of this digital business card
        </p>
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <Label>Design Template</Label>
        <Select
          value={formData.template || "modern"}
          onValueChange={(value) => setFormData({ ...formData, template: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.value} value={template.value}>
                <div>
                  <div className="font-medium">{template.label}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Style */}
      <div className="space-y-2">
        <Label>Font Style</Label>
        <Select
          value={formData.font_style || "sans"}
          onValueChange={(value) => setFormData({ ...formData, font_style: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <div>
                  <div className="font-medium">{font.label}</div>
                  <div className="text-xs text-gray-500">{font.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Color */}
      <div className="space-y-2">
        <Label>Accent Color</Label>
        <div className="flex gap-3 items-center">
          <Input
            type="color"
            value={formData.custom_color || "#000000"}
            onChange={(e) => setFormData({ ...formData, custom_color: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={formData.custom_color || "#000000"}
            onChange={(e) => setFormData({ ...formData, custom_color: e.target.value })}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-gray-500">
          Choose a color that represents your brand or personality
        </p>
      </div>

      {/* Preview Card */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: formData.custom_color || "#000000" }}
            >
              {(formData.full_name || "Preview").charAt(0)}
            </div>
            <p className="text-sm text-gray-600">Preview with selected color</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}