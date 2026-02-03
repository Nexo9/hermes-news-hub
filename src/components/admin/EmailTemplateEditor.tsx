import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Plus, Save, Eye, Code, Edit, Trash2 } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    html_content: "",
    description: "",
    variables: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      setTemplates(data.map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? (t.variables as string[]) : []
      })));
    }
    if (error) console.error("Error fetching templates:", error);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: editingTemplate.subject,
          html_content: editingTemplate.html_content,
          description: editingTemplate.description,
          variables: editingTemplate.variables,
          is_active: editingTemplate.is_active,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast({ title: "Template mis à jour", description: `"${editingTemplate.name}" sauvegardé.` });
      fetchTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.subject) {
      toast({ title: "Erreur", description: "Nom et sujet requis.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const variables = newTemplate.variables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);

      const { error } = await supabase.from("email_templates").insert({
        name: newTemplate.name,
        subject: newTemplate.subject,
        html_content: newTemplate.html_content || "<p>Contenu de l'email</p>",
        description: newTemplate.description || null,
        variables,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast({ title: "Template créé", description: `"${newTemplate.name}" ajouté.` });
      fetchTemplates();
      setIsDialogOpen(false);
      setNewTemplate({ name: "", subject: "", html_content: "", description: "", variables: "" });
    } catch (error: any) {
      console.error("Error creating template:", error);
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
    if (!confirm("Supprimer ce template ?")) return;

    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Template supprimé" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active: !template.is_active })
        .eq("id", template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error("Error toggling:", error);
    }
  };

  const showPreview = (html: string) => {
    // Replace variables with example values for preview
    let preview = html
      .replace(/\{\{username\}\}/g, "JohnDoe")
      .replace(/\{\{code\}\}/g, "123456")
      .replace(/\{\{title\}\}/g, "Titre exemple")
      .replace(/\{\{content\}\}/g, "Contenu de l'exemple...")
      .replace(/\{\{link\}\}/g, "https://hermes.app/reset");
    setPreviewHtml(preview);
    setIsPreviewOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Templates d'emails ({templates.length})
            </CardTitle>
            <CardDescription>Personnalisez les emails envoyés aux utilisateurs</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom unique</label>
                    <Input
                      placeholder="newsletter_weekly"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sujet</label>
                    <Input
                      placeholder="Votre newsletter hebdomadaire"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Newsletter envoyée chaque semaine"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Variables (séparées par des virgules)</label>
                  <Input
                    placeholder="username, date, content"
                    value={newTemplate.variables}
                    onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contenu HTML</label>
                  <textarea
                    className="w-full h-48 p-3 rounded-md border bg-background font-mono text-sm"
                    placeholder="<h1>Bonjour {{username}}</h1>"
                    value={newTemplate.html_content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg overflow-hidden">
                {editingTemplate?.id === template.id ? (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sujet</label>
                        <Input
                          value={editingTemplate.subject}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input
                          value={editingTemplate.description || ""}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <Tabs defaultValue="code">
                      <TabsList>
                        <TabsTrigger value="code" className="gap-1">
                          <Code className="h-4 w-4" />
                          Code HTML
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-1">
                          <Eye className="h-4 w-4" />
                          Aperçu
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="code">
                        <textarea
                          className="w-full h-64 p-3 rounded-md border bg-background font-mono text-sm"
                          value={editingTemplate.html_content}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                        />
                      </TabsContent>
                      <TabsContent value="preview">
                        <div 
                          className="w-full min-h-64 p-4 rounded-md border bg-white text-black"
                          dangerouslySetInnerHTML={{ 
                            __html: editingTemplate.html_content
                              .replace(/\{\{username\}\}/g, "JohnDoe")
                              .replace(/\{\{code\}\}/g, "123456")
                              .replace(/\{\{title\}\}/g, "Titre exemple")
                              .replace(/\{\{content\}\}/g, "Contenu exemple...")
                              .replace(/\{\{link\}\}/g, "https://hermes.app/reset")
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{template.name}</p>
                          {template.variables.map((v) => (
                            <Badge key={v} variant="outline" className="text-xs font-mono">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                          {!template.is_active && (
                            <Badge variant="destructive" className="text-xs">Inactif</Badge>
                          )}
                        </div>
                        <p className="text-sm text-primary mt-1">Sujet: {template.subject}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => toggleActive(template)}
                        />
                        <Button size="sm" variant="outline" onClick={() => showPreview(template.html_content)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Aperçu de l'email</DialogTitle>
            </DialogHeader>
            <div 
              className="p-4 bg-white rounded-lg"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
