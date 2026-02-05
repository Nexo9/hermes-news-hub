import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { FileText, Plus, Save, Trash2, Edit, Search } from "lucide-react";

interface SiteContent {
  id: string;
  key: string;
  title: string;
  content: string;
  content_type: string;
  category: string;
  is_active: boolean;
  updated_at: string;
}

export function SiteContentEditor() {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    key: "",
    title: "",
    content: "",
    content_type: "text",
    category: "general",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .order("category", { ascending: true });

    if (data) setContents(data);
    if (error) console.error("Error fetching content:", error);
  };

  const handleSave = async (content: SiteContent) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("site_content")
        .update({
          title: content.title,
          content: content.content,
          content_type: content.content_type,
          category: content.category,
          is_active: content.is_active,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", content.id);

      if (error) throw error;

      toast({ title: "Contenu mis à jour", description: `"${content.title}" sauvegardé.` });
      fetchContents();
      setEditingContent(null);
    } catch (error) {
      console.error("Error saving content:", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newContent.key || !newContent.title) {
      toast({ title: "Erreur", description: "Clé et titre requis.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("site_content").insert({
        ...newContent,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({ title: "Contenu créé", description: `"${newContent.title}" ajouté.` });
      fetchContents();
      setIsDialogOpen(false);
      setNewContent({ key: "", title: "", content: "", content_type: "text", category: "general" });
    } catch (error: any) {
      console.error("Error creating content:", error);
      toast({ 
        title: "Erreur", 
        description: error.message?.includes("duplicate") ? "Cette clé existe déjà." : "Impossible de créer.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce contenu ?")) return;

    try {
      const { error } = await supabase.from("site_content").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Contenu supprimé" });
      fetchContents();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const toggleActive = async (content: SiteContent) => {
    try {
      const { error } = await supabase
        .from("site_content")
        .update({ is_active: !content.is_active })
        .eq("id", content.id);

      if (error) throw error;
      fetchContents();
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const categories = [...new Set(contents.map((c) => c.category))];
  const filteredContents = contents.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-base sm:text-lg">Contenus ({contents.length})</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Modifiez les textes et contenus affichés</CardDescription>
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
                <DialogTitle>Nouveau contenu</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clé unique</label>
                    <Input
                      placeholder="hero_title"
                      value={newContent.key}
                      onChange={(e) => setNewContent({ ...newContent, key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      placeholder="Titre principal"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catégorie</label>
                    <Select
                      value={newContent.category}
                      onValueChange={(v) => setNewContent({ ...newContent, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="homepage">Page d'accueil</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="about">À propos</SelectItem>
                        <SelectItem value="legal">Légal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newContent.content_type}
                      onValueChange={(v) => setNewContent({ ...newContent, content_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte simple</SelectItem>
                        <SelectItem value="rich_text">Texte riche</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contenu</label>
                  <Textarea
                    placeholder="Contenu..."
                    rows={5}
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le contenu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 order-2 sm:order-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40 order-1 sm:order-2">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px]">
          <div className="space-y-3">
            {filteredContents.map((content) => (
              <div
                key={content.id}
                className="border rounded-lg p-4 hover:bg-accent/30 transition-colors"
              >
                {editingContent?.id === content.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={editingContent.title}
                        onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                      />
                      <Select
                        value={editingContent.category}
                        onValueChange={(v) => setEditingContent({ ...editingContent, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Général</SelectItem>
                          <SelectItem value="homepage">Page d'accueil</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="about">À propos</SelectItem>
                          <SelectItem value="legal">Légal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={editingContent.content}
                      onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(editingContent)} disabled={loading}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingContent(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="font-semibold text-sm sm:text-base">{content.title}</p>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{content.key}</Badge>
                        <Badge className="text-[10px] sm:text-xs">{content.category}</Badge>
                        {!content.is_active && (
                          <Badge variant="destructive" className="text-[10px] sm:text-xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {content.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Switch
                        checked={content.is_active}
                        onCheckedChange={() => toggleActive(content)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => setEditingContent(content)}>
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(content.id)}>
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
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
