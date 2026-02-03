import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Plus, Save, Trash2, RefreshCw, Globe, Lock } from "lucide-react";

interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  is_public: boolean;
  updated_at: string;
}

export function PlatformSettingsEditor() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "{}",
    description: "",
    category: "general",
    is_public: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("category", { ascending: true });

    if (data) setSettings(data);
    if (error) console.error("Error fetching settings:", error);
  };

  const handleSave = async (setting: PlatformSetting) => {
    setLoading(true);
    try {
      const parsedValue = JSON.parse(editValue);
      const { error } = await supabase
        .from("platform_settings")
        .update({
          value: parsedValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", setting.id);

      if (error) throw error;

      toast({ title: "Paramètre mis à jour", description: `"${setting.key}" sauvegardé.` });
      fetchSettings();
      setEditingId(null);
    } catch (error: any) {
      console.error("Error saving setting:", error);
      toast({ 
        title: "Erreur", 
        description: error.message?.includes("JSON") ? "JSON invalide" : "Impossible de sauvegarder.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSetting.key) {
      toast({ title: "Erreur", description: "Clé requise.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const parsedValue = JSON.parse(newSetting.value);
      const { error } = await supabase.from("platform_settings").insert({
        key: newSetting.key,
        value: parsedValue,
        description: newSetting.description || null,
        category: newSetting.category,
        is_public: newSetting.is_public,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({ title: "Paramètre créé", description: `"${newSetting.key}" ajouté.` });
      fetchSettings();
      setIsDialogOpen(false);
      setNewSetting({ key: "", value: "{}", description: "", category: "general", is_public: false });
    } catch (error: any) {
      console.error("Error creating setting:", error);
      toast({ 
        title: "Erreur", 
        description: error.message?.includes("duplicate") ? "Cette clé existe déjà." : 
                     error.message?.includes("JSON") ? "JSON invalide" : "Impossible de créer.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce paramètre ?")) return;

    try {
      const { error } = await supabase.from("platform_settings").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Paramètre supprimé" });
      fetchSettings();
    } catch (error) {
      console.error("Error deleting setting:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const togglePublic = async (setting: PlatformSetting) => {
    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({ is_public: !setting.is_public })
        .eq("id", setting.id);

      if (error) throw error;
      fetchSettings();
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const startEditing = (setting: PlatformSetting) => {
    setEditingId(setting.id);
    setEditValue(JSON.stringify(setting.value, null, 2));
  };

  const getValueDisplay = (value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.enabled === "boolean") {
        return obj.enabled ? "✅ Activé" : "❌ Désactivé";
      }
      if (typeof obj.value !== "undefined") {
        return String(obj.value);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const categories = [...new Set(settings.map((s) => s.category))];
  const filteredSettings = settings.filter(
    (s) => selectedCategory === "all" || s.category === selectedCategory
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres globaux ({settings.length})
            </CardTitle>
            <CardDescription>Configurez les paramètres de la plateforme pour tous les utilisateurs</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchSettings}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau paramètre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clé unique</label>
                    <Input
                      placeholder="max_upload_size"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Taille max des uploads"
                      value={newSetting.description}
                      onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Catégorie</label>
                      <Select
                        value={newSetting.category}
                        onValueChange={(v) => setNewSetting({ ...newSetting, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Général</SelectItem>
                          <SelectItem value="auth">Authentification</SelectItem>
                          <SelectItem value="content">Contenu</SelectItem>
                          <SelectItem value="features">Fonctionnalités</SelectItem>
                          <SelectItem value="appearance">Apparence</SelectItem>
                          <SelectItem value="system">Système</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Public</label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={newSetting.is_public}
                          onCheckedChange={(v) => setNewSetting({ ...newSetting, is_public: v })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {newSetting.is_public ? "Visible par tous" : "Admin seulement"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valeur (JSON)</label>
                    <textarea
                      className="w-full h-24 p-3 rounded-md border bg-background font-mono text-sm"
                      placeholder='{"enabled": true}'
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={loading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le paramètre
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {filteredSettings.map((setting) => (
              <div
                key={setting.id}
                className="border rounded-lg p-4 hover:bg-accent/30 transition-colors"
              >
                {editingId === setting.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{setting.key}</Badge>
                      <Badge>{setting.category}</Badge>
                    </div>
                    <textarea
                      className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(setting)} disabled={loading}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold font-mono text-sm">{setting.key}</p>
                        <Badge>{setting.category}</Badge>
                        {setting.is_public ? (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Privé
                          </Badge>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                      )}
                      <p className="text-sm font-mono mt-2 p-2 bg-muted rounded">
                        {getValueDisplay(setting.value)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.is_public}
                        onCheckedChange={() => togglePublic(setting)}
                      />
                      <Button size="sm" variant="outline" onClick={() => startEditing(setting)}>
                        Modifier
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(setting.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
