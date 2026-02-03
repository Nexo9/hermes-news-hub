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
import { Flag, Plus, Trash2, Users, Crown, Shield, Sparkles } from "lucide-react";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  applies_to: string;
  conditions: unknown;
  updated_at: string;
}

export function FeatureFlagsEditor() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({
    name: "",
    description: "",
    applies_to: "all",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("name", { ascending: true });

    if (data) setFlags(data);
    if (error) console.error("Error fetching flags:", error);
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ 
          is_enabled: !flag.is_enabled,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", flag.id);

      if (error) throw error;

      toast({ 
        title: flag.is_enabled ? "Fonctionnalité désactivée" : "Fonctionnalité activée",
        description: `"${flag.name}" a été ${flag.is_enabled ? "désactivée" : "activée"}.`
      });
      fetchFlags();
    } catch (error) {
      console.error("Error toggling flag:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!newFlag.name) {
      toast({ title: "Erreur", description: "Nom requis.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feature_flags").insert({
        name: newFlag.name,
        description: newFlag.description || null,
        applies_to: newFlag.applies_to,
        is_enabled: false,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({ title: "Feature flag créé", description: `"${newFlag.name}" ajouté.` });
      fetchFlags();
      setIsDialogOpen(false);
      setNewFlag({ name: "", description: "", applies_to: "all" });
    } catch (error: any) {
      console.error("Error creating flag:", error);
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
    if (!confirm("Supprimer ce feature flag ?")) return;

    try {
      const { error } = await supabase.from("feature_flags").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Feature flag supprimé" });
      fetchFlags();
    } catch (error) {
      console.error("Error deleting flag:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const handleAppliesToChange = async (flag: FeatureFlag, newValue: string) => {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ 
          applies_to: newValue,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", flag.id);

      if (error) throw error;
      fetchFlags();
    } catch (error) {
      console.error("Error updating flag:", error);
    }
  };

  const getAppliesToBadge = (appliesTo: string) => {
    switch (appliesTo) {
      case "all":
        return (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Tous
          </Badge>
        );
      case "premium":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1">
            <Sparkles className="h-3 w-3" />
            Premium
          </Badge>
        );
      case "elite":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
            <Crown className="h-3 w-3" />
            Élite
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      default:
        return <Badge variant="outline">{appliesTo}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Feature Flags ({flags.length})
            </CardTitle>
            <CardDescription>Activez ou désactivez des fonctionnalités pour différents groupes d'utilisateurs</CardDescription>
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
                <DialogTitle>Nouveau feature flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom unique</label>
                  <Input
                    placeholder="new_dashboard"
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Nouveau tableau de bord redesigné"
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">S'applique à</label>
                  <Select
                    value={newFlag.applies_to}
                    onValueChange={(v) => setNewFlag({ ...newFlag, applies_to: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="premium">Premium seulement</SelectItem>
                      <SelectItem value="elite">Élite seulement</SelectItem>
                      <SelectItem value="admin">Admins seulement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le feature flag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className={`border rounded-lg p-4 transition-colors ${
                  flag.is_enabled ? "bg-green-500/5 border-green-500/30" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold font-mono">{flag.name}</p>
                      {getAppliesToBadge(flag.applies_to)}
                      <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                        {flag.is_enabled ? "Activé" : "Désactivé"}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={flag.applies_to}
                      onValueChange={(v) => handleAppliesToChange(flag, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="elite">Élite</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={() => handleToggle(flag)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(flag.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
