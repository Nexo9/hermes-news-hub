import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NewsCard } from "@/components/NewsCard";
import { ThreadSection } from "@/components/ThreadSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bookmark, Heart, Sparkles } from "lucide-react";

interface News {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  published_at: string;
  source_urls: string[];
}

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<News[]>([]);
  const [liked, setLiked] = useState<News[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
      fetchLiked();
    }
  }, [userId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    setLoading(false);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from("news_favorites")
      .select("news_id, news(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setFavorites(data.map((d: any) => d.news).filter(Boolean));
    }
  };

  const fetchLiked = async () => {
    const { data } = await supabase
      .from("news_likes")
      .select("news_id, news(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setLiked(data.map((d: any) => d.news).filter(Boolean));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/")} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Mes Collections</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="favorites" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Favoris ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="w-4 h-4" />
              Likés ({liked.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="animate-fade-in">
            {favorites.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Aucun favori</p>
                <p className="text-sm">Enregistrez des actualités pour les retrouver ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((item) => (
                  <NewsCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    summary={item.summary}
                    category={item.category}
                    location={item.location}
                    publishedAt={item.published_at}
                    sourceUrls={item.source_urls}
                    userId={userId}
                    onViewThreads={(id) => setSelectedNews({ id, title: item.title })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="animate-fade-in">
            {liked.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Aucun like</p>
                <p className="text-sm">Likez des actualités pour les retrouver ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liked.map((item) => (
                  <NewsCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    summary={item.summary}
                    category={item.category}
                    location={item.location}
                    publishedAt={item.published_at}
                    sourceUrls={item.source_urls}
                    userId={userId}
                    onViewThreads={(id) => setSelectedNews({ id, title: item.title })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ThreadSection
        newsId={selectedNews?.id || null}
        newsTitle={selectedNews?.title || ""}
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
      />
    </div>
  );
};

export default Favorites;
