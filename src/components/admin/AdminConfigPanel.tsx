import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteContentEditor } from "./SiteContentEditor";
import { PlatformSettingsEditor } from "./PlatformSettingsEditor";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { FeatureFlagsEditor } from "./FeatureFlagsEditor";
import { ThemeConfigEditor } from "./ThemeConfigEditor";
import { FileText, Settings, Mail, Flag, Palette } from "lucide-react";

export function AdminConfigPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration de la plateforme</h2>
        <p className="text-muted-foreground">
          Gérez tous les aspects de la plateforme en temps réel
        </p>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contenus</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Thèmes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <SiteContentEditor />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <PlatformSettingsEditor />
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <EmailTemplateEditor />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeatureFlagsEditor />
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          <ThemeConfigEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
