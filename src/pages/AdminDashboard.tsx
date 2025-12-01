import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Megaphone, Users, Settings } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
  };
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnnouncements();
      fetchProfiles();
      
      // Realtime subscriptions
      const announcementsChannel = supabase
        .channel("announcements-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "announcements" },
          () => fetchAnnouncements()
        )
        .subscribe();

      const profilesChannel = supabase
        .channel("profiles-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => fetchProfiles()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(announcementsChannel);
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur pour accéder à cette page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    if (data) setAnnouncements(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setProfiles(data);
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("announcements").insert({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      author_id: user.id,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'annonce.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Annonce créée",
      description: "L'annonce a été publiée avec succès.",
    });

    setNewAnnouncement({ title: "", content: "" });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Annonce supprimée",
      description: "L'annonce a été supprimée avec succès.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Vérification des permissions...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Dashboard Administrateur</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Retour au site
          </Button>
        </div>

        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">
              <Megaphone className="h-4 w-4 mr-2" />
              Annonces
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Créer une annonce</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Titre de l'annonce"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Contenu de l'annonce"
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                  }
                  rows={4}
                />
                <Button onClick={handleCreateAnnouncement}>Publier l'annonce</Button>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-semibold">Annonces récentes</h2>
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{announcement.title}</CardTitle>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Par {announcement.profiles.username} •{" "}
                      {new Date(announcement.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs ({profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{profile.username}</p>
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground">{profile.bio}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Inscrit le {new Date(profile.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile/${profile.username}`)}
                      >
                        Voir le profil
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du site</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Section en développement. Fonctionnalités à venir :
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                  <li>Configuration des catégories de news</li>
                  <li>Gestion des emplacements géographiques</li>
                  <li>Modération des contenus</li>
                  <li>Paramètres de sécurité</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
