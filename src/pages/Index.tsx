import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NewsCard } from "@/components/NewsCard";
import { FilterBar } from "@/components/FilterBar";
import { ThreadSection } from "@/components/ThreadSection";
import { FriendsList } from "@/components/FriendsList";
import { GroupsList } from "@/components/GroupsList";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Newspaper, Sparkles, LogOut, User as UserIcon, MessageCircle, Search as SearchIcon, Shield, Bookmark, Loader2, Map, FileText, Crown, Gamepad2 } from "lucide-react";
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState({ category: "Toutes", location: "Toutes", search: "", timeFilter: "all" });
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    checkUser();
    fetchNews(0, true);
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

      // Check admin status
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roles);
    }
  };

  const fetchNews = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les actualités",
        variant: "destructive",
      });
    } else {
      const newData = data || [];
      if (isInitial) {
        setNews(newData);
      } else {
        setNews((prev) => [...prev, ...newData]);
      }
      setHasMore(newData.length === PAGE_SIZE);
    }

    if (isInitial) {
      setIsLoading(false);
    } else {
      setIsLoadingMore(false);
    }
  }, [toast]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchNews(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoadingMore, isLoading, page, fetchNews]);

  // Apply filters to news
  useEffect(() => {
    applyFilters();
  }, [news, filters]);

  const applyFilters = () => {
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

  const handleFilterChange = (newFilters: { category: string; location: string; search: string; timeFilter: string }) => {
    setFilters(newFilters);
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
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">HERMÈS</h1>
                  <p className="text-xs text-muted-foreground">Information Neutre & Sociale</p>
                </div>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/map')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Carte
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/terms')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Charte
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Premium
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/games')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Mini-Jeux
                </Button>
              </nav>
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
                  <DropdownMenuItem onClick={() => navigate('/search')}>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Rechercher
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Mes Collections
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/map')} className="md:hidden">
                    <Map className="mr-2 h-4 w-4" />
                    Carte des Actualités
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/terms')} className="md:hidden">
                    <FileText className="mr-2 h-4 w-4" />
                    Charte d'Utilisation
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Administration
                      </DropdownMenuItem>
                    </>
                  )}
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
        <div className="flex gap-8">
          {/* News Feed */}
          <div className="flex-1">
            {/* Filters */}
            <FilterBar onFilterChange={handleFilterChange} />

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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNews.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
                    >
                      <NewsCard
                        id={item.id}
                        title={item.title}
                        summary={item.summary}
                        category={item.category}
                        location={item.location}
                        publishedAt={item.published_at}
                        sourceUrls={item.source_urls}
                        userId={user?.id}
                        onViewThreads={(id) => setSelectedNews({ id, title: item.title })}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                  {isLoadingMore && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  )}
                  {!hasMore && filteredNews.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Vous avez tout vu !
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Friends & Groups (only when logged in) - Desktop */}
          {user && (
            <aside className="hidden lg:block w-80 shrink-0 space-y-6">
              <div className="sticky top-24 space-y-6">
                <FriendsList userId={user.id} />
                <GroupsList userId={user.id} />
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Groups Section */}
        {user && (
          <div className="lg:hidden mt-8 space-y-6">
            <GroupsList userId={user.id} />
            <FriendsList userId={user.id} />
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
