import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Megaphone, Users, Settings, Newspaper, MessageSquare, Trash2, 
  BarChart3, Shield, ArrowLeft, Search, RefreshCw,
  TrendingUp, Heart, Bookmark, Share2, Calendar, Bot, Palette, Wrench
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AntikIAPanel } from "@/components/AntikIAPanel";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { ThemeSelector } from "@/components/ThemeSelector";
import { SystemMessagesPanel } from "@/components/SystemMessagesPanel";
import { AdminConfigPanel } from "@/components/admin/AdminConfigPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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

interface Thread {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  news_id: string;
  profiles: { username: string };
  news: { title: string };
}

interface Stats {
  totalUsers: number;
  totalNews: number;
  totalThreads: number;
  totalLikes: number;
  totalFavorites: number;
  totalShares: number;
  newUsersToday: number;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeTab, setActiveTab] = useState("announcements");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalNews: 0,
    totalThreads: 0,
    totalLikes: 0,
    totalFavorites: 0,
    totalShares: 0,
    newUsersToday: 0,
  });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });
  const [searchThread, setSearchThread] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
      
      const announcementsChannel = supabase
        .channel("admin-announcements")
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetchAnnouncements())
        .subscribe();

      const threadsChannel = supabase
        .channel("admin-threads")
        .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () => {
          fetchThreads();
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(announcementsChannel);
        supabase.removeChannel(threadsChannel);
      };
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAnnouncements(),
      fetchThreads(),
      fetchStats(),
    ]);
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUserId(user.id);

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

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalUsers },
      { count: totalNews },
      { count: totalThreads },
      { count: totalLikes },
      { count: totalFavorites },
      { count: totalShares },
      { count: newUsersToday },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("news").select("*", { count: "exact", head: true }),
      supabase.from("threads").select("*", { count: "exact", head: true }),
      supabase.from("news_likes").select("*", { count: "exact", head: true }),
      supabase.from("news_favorites").select("*", { count: "exact", head: true }),
      supabase.from("news_shares").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    ]);

    setStats({
      totalUsers: totalUsers || 0,
      totalNews: totalNews || 0,
      totalThreads: totalThreads || 0,
      totalLikes: totalLikes || 0,
      totalFavorites: totalFavorites || 0,
      totalShares: totalShares || 0,
      newUsersToday: newUsersToday || 0,
    });
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    if (data) setAnnouncements(data);
  };

  const fetchThreads = async () => {
    const { data } = await supabase
      .from("threads")
      .select("id, content, created_at, user_id, news_id, profiles(username), news(title)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const formattedThreads = data.map((t) => ({
        ...t,
        profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
        news: Array.isArray(t.news) ? t.news[0] : t.news,
      })) as Thread[];
      setThreads(formattedThreads);
    }
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

    // Send email to all users about the announcement
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          type: "announcement",
          title: newAnnouncement.title,
          content: newAnnouncement.content,
        },
      });
    } catch (e) {
      console.log("Email sending skipped");
    }

    toast({
      title: "Annonce créée",
      description: "L'annonce a été publiée avec succès.",
    });

    setNewAnnouncement({ title: "", content: "" });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'annonce.", variant: "destructive" });
      return;
    }

    toast({ title: "Annonce supprimée", description: "L'annonce a été supprimée avec succès." });
  };

  const handleDeleteThread = async (id: string) => {
    const { error } = await supabase.from("threads").delete().eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le thread.", variant: "destructive" });
      return;
    }

    toast({ title: "Thread supprimé", description: "Le thread a été supprimé avec succès." });
  };

  const filteredThreads = threads.filter((t) =>
    t.content.toLowerCase().includes(searchThread.toLowerCase()) ||
    t.profiles?.username?.toLowerCase().includes(searchThread.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          <span>Vérification des permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button onClick={() => navigate("/")} variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Dashboard Administrateur
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Gérez votre plateforme HERMÈS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector isPremium={true} isAdmin={true} />
            <Button onClick={fetchAllData} variant="outline" size="icon" className="sm:hidden">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={fetchAllData} variant="outline" className="gap-2 hidden sm:flex">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">+{stats.newUsersToday}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalNews}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Actualités</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalThreads}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Threads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalLikes}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalFavorites}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Favoris</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-4 sm:p-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalShares}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Partages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile ? (
          <div className="mb-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {activeTab === "announcements" && <><Megaphone className="h-4 w-4" /> Annonces</>}
                    {activeTab === "users" && <><Users className="h-4 w-4" /> Utilisateurs</>}
                    {activeTab === "moderation" && <><MessageSquare className="h-4 w-4" /> Modération</>}
                    {activeTab === "config" && <><Wrench className="h-4 w-4" /> Configuration</>}
                    {activeTab === "antikia" && <><Bot className="h-4 w-4" /> Antik-IA</>}
                    {activeTab === "settings" && <><Settings className="h-4 w-4" /> Paramètres</>}
                  </span>
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto rounded-t-xl">
                <SheetHeader className="pb-4">
                  <SheetTitle>Sections Admin</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {[
                    { value: "announcements", icon: Megaphone, label: "Annonces" },
                    { value: "users", icon: Users, label: "Utilisateurs" },
                    { value: "moderation", icon: MessageSquare, label: "Modération" },
                    { value: "config", icon: Wrench, label: "Configuration" },
                    { value: "antikia", icon: Bot, label: "Antik-IA" },
                    { value: "settings", icon: Settings, label: "Paramètres" },
                  ].map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "outline"}
                      className="justify-start gap-2 h-12"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full ${isMobile ? 'hidden' : 'grid grid-cols-6'}`}>
            <TabsTrigger value="announcements" className="gap-1 sm:gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 sm:gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1 sm:gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Modération</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1 sm:gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="antikia" className="gap-1 sm:gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Antik-IA</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une annonce</CardTitle>
                  <CardDescription>Publiez une annonce visible par tous les utilisateurs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Titre de l'annonce"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Contenu de l'annonce"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    rows={4}
                  />
                  <Button onClick={handleCreateAnnouncement} className="w-full">
                    Publier l'annonce
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Annonces récentes ({announcements.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{announcement.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Par {announcement.profiles?.username} • {new Date(announcement.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAnnouncement(announcement.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Modération des threads ({threads.length})</CardTitle>
                    <CardDescription>Supervisez et modérez les discussions</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchThread}
                      onChange={(e) => setSearchThread(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredThreads.map((thread) => (
                      <div key={thread.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{thread.profiles?.username}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(thread.created_at).toLocaleString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-sm line-clamp-2">{thread.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sur: {thread.news?.title || "Article supprimé"}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce thread ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action supprimera le thread et toutes ses réponses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteThread(thread.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Antik-IA Tab */}
          <TabsContent value="antikia">
            <AntikIAPanel userId={userId} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration de la plateforme</CardTitle>
                  <CardDescription>Gérez les paramètres généraux</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-medium mb-2">Catégories de news</h4>
                    <p className="text-sm text-muted-foreground">
                      Politique, Économie, Technologie, Sport, Culture, Science, Santé
                    </p>
                  </div>
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-medium mb-2">Localisations</h4>
                    <p className="text-sm text-muted-foreground">
                      France, Europe, Monde, Afrique, Amérique, Asie
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations système</CardTitle>
                  <CardDescription>État de la plateforme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Base de données</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-600">
                      Connectée
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Stockage</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-600">
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Antik-IA</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-600">
                      En ligne
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Temps réel</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-600">
                      Actif
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Messages */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Messages système</CardTitle>
                  <CardDescription>Envoyez des messages système aux utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemMessagesPanel />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <AdminConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
