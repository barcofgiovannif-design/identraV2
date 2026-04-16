import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplatesPanel from "./TemplatesPanel";
import TeamsPanel from "./TeamsPanel";
import WebhooksPanel from "./WebhooksPanel";
import AuditLogPanel from "./AuditLogPanel";
import BrandingSettings from "./BrandingSettings";

export default function SettingsPanel({ company, cards = [] }) {
  return (
    <Tabs defaultValue="branding" className="space-y-4">
      <TabsList className="bg-white border border-gray-200 flex-wrap h-auto">
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        <TabsTrigger value="audit">Audit log</TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <BrandingSettings company={company} />
      </TabsContent>
      <TabsContent value="templates">
        <TemplatesPanel company={company} />
      </TabsContent>
      <TabsContent value="teams">
        <TeamsPanel company={company} cards={cards} />
      </TabsContent>
      <TabsContent value="webhooks">
        <WebhooksPanel company={company} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLogPanel company={company} />
      </TabsContent>
    </Tabs>
  );
}
