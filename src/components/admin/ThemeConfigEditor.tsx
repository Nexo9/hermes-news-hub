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
import { Palette, Plus, Save, Trash2, Star, Edit } from "lucide-react";

interface ThemeConfig {
  id: string;
  name: string;
  description: string | null;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
  subscription_required: string;
  updated_at: string;
}

export function ThemeConfigEditor() {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: "",
    description: "",
    primary: "270 100% 50%",
    background: "270 100% 10%",
    accent: "270 100% 50%",
    subscription_required: "free",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    const { data, error } = await supabase
      .from("theme_configs")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      setThemes(data.map(t => ({
        ...t,
        colors: (t.colors as Record<string, string>) || {},
        fonts: (t.fonts as Record<string, string>) || {},
      })));
    }
    if (error) console.error("Error fetching themes:", error);
  };

  const handleSave = async () => {
    if (!editingTheme) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("theme_configs")
        .update({
          description: editingTheme.description,
          colors: editingTheme.colors,
          fonts: editingTheme.fonts,
          is_active: editingTheme.is_active,
          subscription_required: editingTheme.subscription_required,
        })
        .eq("id", editingTheme.id);

      if (error) throw error;

      toast({ title: "Thème mis à jour", description: `"${editingTheme.name}" sauvegardé.` });
      fetchThemes();
      setEditingTheme(null);
    } catch (error) {
      console.error("Error saving theme:", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTheme.name) {
      toast({ title: "Erreur", description: "Nom requis.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("theme_configs").insert({
        name: newTheme.name,
        description: newTheme.description || null,
        colors: {
          primary: newTheme.primary,
          background: newTheme.background,
          accent: newTheme.accent,
        },
        fonts: {},
        subscription_required: newTheme.subscription_required,
      });

      if (error) throw error;

      toast({ title: "Thème créé", description: `"${newTheme.name}" ajouté.` });
      fetchThemes();
      setIsDialogOpen(false);
      setNewTheme({
        name: "",
        description: "",
        primary: "270 100% 50%",
        background: "270 100% 10%",
        accent: "270 100% 50%",
        subscription_required: "free",
      });
    } catch (error: any) {
      console.error("Error creating theme:", error);
      toast({ 
        title: "Erreur", 
        description: error.message?.includes("duplicate") ? "Ce nom existe déjà." : "Impossible de créer.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce thème ?")) return;

    try {
      const { error } = await supabase.from("theme_configs").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Thème supprimé" });
      fetchThemes();
    } catch (error) {
      console.error("Error deleting theme:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const setAsDefault = async (theme: ThemeConfig) => {
    try {
      // First, unset all defaults
      await supabase.from("theme_configs").update({ is_default: false }).neq("id", "");
      
      // Then set this one as default
      const { error } = await supabase
        .from("theme_configs")
        .update({ is_default: true })
        .eq("id", theme.id);

      if (error) throw error;

      toast({ title: "Thème par défaut", description: `"${theme.name}" est maintenant le thème par défaut.` });
      fetchThemes();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const toggleActive = async (theme: ThemeConfig) => {
    try {
      const { error } = await supabase
        .from("theme_configs")
        .update({ is_active: !theme.is_active })
        .eq("id", theme.id);

      if (error) throw error;
      fetchThemes();
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const getSubscriptionBadge = (sub: string) => {
    switch (sub) {
      case "free":
        return <Badge variant="outline">Gratuit</Badge>;
      case "premium":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Premium</Badge>;
      case "elite":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Élite</Badge>;
      default:
        return <Badge variant="outline">{sub}</Badge>;
    }
  };

  const renderColorPreview = (colors: Record<string, string>) => (
    <div className="flex gap-1">
      {Object.entries(colors).slice(0, 3).map(([name, value]) => (
        <div
          key={name}
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: `hsl(${value})` }}
          title={`${name}: ${value}`}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Thèmes ({themes.length})
            </CardTitle>
            <CardDescription>Gérez les thèmes visuels disponibles pour les utilisateurs</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau thème</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom unique</label>
                    <Input
                      placeholder="ocean-blue"
                      value={newTheme.name}
                      onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Abonnement requis</label>
                    <Select
                      value={newTheme.subscription_required}
                      onValueChange={(v) => setNewTheme({ ...newTheme, subscription_required: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Gratuit</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="elite">Élite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Un thème bleu océan apaisant"
                    value={newTheme.description}
                    onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary (HSL)</label>
                    <Input
                      placeholder="270 100% 50%"
                      value={newTheme.primary}
                      onChange={(e) => setNewTheme({ ...newTheme, primary: e.target.value })}
                    />
                    <div
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: `hsl(${newTheme.primary})` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Background (HSL)</label>
                    <Input
                      placeholder="270 100% 10%"
                      value={newTheme.background}
                      onChange={(e) => setNewTheme({ ...newTheme, background: e.target.value })}
                    />
                    <div
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: `hsl(${newTheme.background})` }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Accent (HSL)</label>
                    <Input
                      placeholder="270 100% 50%"
                      value={newTheme.accent}
                      onChange={(e) => setNewTheme({ ...newTheme, accent: e.target.value })}
                    />
                    <div
                      className="w-full h-6 rounded border"
                      style={{ backgroundColor: `hsl(${newTheme.accent})` }}
                    />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le thème
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`border rounded-lg p-4 transition-colors ${
                  theme.is_default ? "border-primary bg-primary/5" : ""
                }`}
              >
                {editingTheme?.id === theme.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input
                          value={editingTheme.description || ""}
                          onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Abonnement requis</label>
                        <Select
                          value={editingTheme.subscription_required}
                          onValueChange={(v) => setEditingTheme({ ...editingTheme, subscription_required: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratuit</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="elite">Élite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(editingTheme.colors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium capitalize">{key} (HSL)</label>
                          <Input
                            value={value}
                            onChange={(e) => setEditingTheme({
                              ...editingTheme,
                              colors: { ...editingTheme.colors, [key]: e.target.value }
                            })}
                          />
                          <div
                            className="w-full h-6 rounded border"
                            style={{ backgroundColor: `hsl(${value})` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTheme(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {renderColorPreview(theme.colors)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{theme.name}</p>
                          {theme.is_default && (
                            <Badge className="gap-1">
                              <Star className="h-3 w-3" />
                              Par défaut
                            </Badge>
                          )}
                          {getSubscriptionBadge(theme.subscription_required)}
                          {!theme.is_active && (
                            <Badge variant="destructive">Inactif</Badge>
                          )}
                        </div>
                        {theme.description && (
                          <p className="text-sm text-muted-foreground">{theme.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={theme.is_active}
                        onCheckedChange={() => toggleActive(theme)}
                      />
                      {!theme.is_default && (
                        <Button size="sm" variant="outline" onClick={() => setAsDefault(theme)}>
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditingTheme(theme)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(theme.id)}>
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
