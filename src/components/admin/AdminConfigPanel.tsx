import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SiteContentEditor } from "./SiteContentEditor";
import { PlatformSettingsEditor } from "./PlatformSettingsEditor";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { FeatureFlagsEditor } from "./FeatureFlagsEditor";
import { ThemeConfigEditor } from "./ThemeConfigEditor";
import { FileText, Settings, Mail, Flag, Palette, Menu } from "lucide-react";

export function AdminConfigPanel() {
  const [activeTab, setActiveTab] = useState("content");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const tabs = [
    { value: "content", icon: FileText, label: "Contenus" },
    { value: "settings", icon: Settings, label: "Paramètres" },
    { value: "emails", icon: Mail, label: "Emails" },
    { value: "features", icon: Flag, label: "Features" },
    { value: "themes", icon: Palette, label: "Thèmes" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Configuration de la plateforme</h2>
        <p className="text-sm text-muted-foreground">
          Gérez tous les aspects de la plateforme en temps réel
        </p>
      </div>

      {/* Mobile Tab Selector */}
      {isMobile && (
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2">
              <span className="flex items-center gap-2">
                {(() => {
                  const currentTab = tabs.find(t => t.value === activeTab);
                  if (currentTab) {
                    const Icon = currentTab.icon;
                    return (
                      <>
                        <Icon className="h-4 w-4" />
                        {currentTab.label}
                      </>
                    );
                  }
                  return null;
                })()}
              </span>
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Configuration</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 pb-4">
              {tabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? "default" : "outline"}
                  className="justify-start gap-2 h-12"
                  onClick={() => {
                    setActiveTab(tab.value);
                    setIsMenuOpen(false);
                  }}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`w-full ${isMobile ? 'hidden' : 'grid grid-cols-5'}`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1 sm:gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="content" className="mt-4 sm:mt-6">
          <SiteContentEditor />
        </TabsContent>

        <TabsContent value="settings" className="mt-4 sm:mt-6">
          <PlatformSettingsEditor />
        </TabsContent>

        <TabsContent value="emails" className="mt-4 sm:mt-6">
          <EmailTemplateEditor />
        </TabsContent>

        <TabsContent value="features" className="mt-4 sm:mt-6">
          <FeatureFlagsEditor />
        </TabsContent>

        <TabsContent value="themes" className="mt-4 sm:mt-6">
          <ThemeConfigEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
