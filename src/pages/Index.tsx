import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NewsCard } from "@/components/NewsCard";
import { FilterBar } from "@/components/FilterBar";
import { ThreadSection } from "@/components/ThreadSection";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, Sparkles, LogOut, User as UserIcon, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface News {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  published_at: string;
  source_urls: string[];
}

const Index = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchNews();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    
    if (data.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", data.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  const fetchNews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les actualités",
        variant: "destructive",
      });
    } else {
      setNews(data || []);
      setFilteredNews(data || []);
    }
    setIsLoading(false);
  };

  const handleFilterChange = (filters: { category: string; location: string; search: string; timeFilter: string }) => {
    let filtered = [...news];

    if (filters.category !== "Toutes") {
      filtered = filtered.filter((n) => n.category === filters.category);
    }

    if (filters.location !== "Toutes") {
      filtered = filtered.filter((n) => n.location === filters.location);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) || n.summary.toLowerCase().includes(searchLower)
      );
    }

    if (filters.timeFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((n) => {
        const publishedDate = new Date(n.published_at);
        const diffTime = now.getTime() - publishedDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (filters.timeFilter === "today") {
          return diffDays < 1;
        } else if (filters.timeFilter === "week") {
          return diffDays < 7;
        } else if (filters.timeFilter === "month") {
          return diffDays < 30;
        }
        return true;
      });
    }

    setFilteredNews(filtered);
  };

  const handleAuth = async () => {
    window.location.href = "/auth";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast({
      title: "Déconnexion",
      description: "À bientôt sur HERMÈS",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">HERMÈS</h1>
                <p className="text-xs text-muted-foreground">Information Neutre & Sociale</p>
              </div>
            </div>

            {!user ? (
              <Button onClick={handleAuth} className="bg-primary hover:bg-primary/90">
                Connexion
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => window.location.href = `/profile/${profile?.username}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* News Feed */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Newspaper className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Aucune actualité trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <NewsCard
                key={item.id}
                id={item.id}
                title={item.title}
                summary={item.summary}
                category={item.category}
                location={item.location}
                publishedAt={item.published_at}
                sourceUrls={item.source_urls}
                onViewThreads={(id) => setSelectedNews({ id, title: item.title })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Thread Dialog */}
      <ThreadSection
        newsId={selectedNews?.id || null}
        newsTitle={selectedNews?.title || ""}
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
      />
    </div>
  );
};

export default Index;
