import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MessageCircle, 
  Loader2,
  Users,
  Sparkles,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialThreadReplies } from "@/components/social/SocialThreadReplies";
import { CategorySidebar, INTEREST_CATEGORIES } from "@/components/social/CategorySidebar";
import { SearchBar } from "@/components/social/SearchBar";
import { TrendingHashtags, extractHashtags } from "@/components/social/TrendingHashtags";
import { ComposeThread } from "@/components/social/ComposeThread";
import { ThreadCard } from "@/components/social/ThreadCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface SocialThread {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: Profile | null;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  hashtags: string[];
}

const WhatPeopleSay = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [threads, setThreads] = useState<SocialThread[]>([]);
  const [newThread, setNewThread] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [feedType, setFeedType] = useState<"recent" | "popular">("recent");

  useEffect(() => {
    checkUser();
    fetchThreads();

    const channel = supabase
      .channel('social-threads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_threads' },
        () => fetchThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);
    }
  };

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    
    const { data: threadsData, error } = await supabase
      .from("social_threads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching threads:", error);
      setIsLoading(false);
      return;
    }

    if (!threadsData || threadsData.length === 0) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(threadsData.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const threadIds = threadsData.map(t => t.id);
    const { data: likesData } = await supabase
      .from("social_thread_likes")
      .select("thread_id")
      .in("thread_id", threadIds);

    const likesCountMap = new Map<string, number>();
    likesData?.forEach(like => {
      likesCountMap.set(like.thread_id, (likesCountMap.get(like.thread_id) || 0) + 1);
    });

    const { data: repliesData } = await supabase
      .from("social_thread_replies")
      .select("thread_id")
      .in("thread_id", threadIds);

    const repliesCountMap = new Map<string, number>();
    repliesData?.forEach(reply => {
      repliesCountMap.set(reply.thread_id, (repliesCountMap.get(reply.thread_id) || 0) + 1);
    });

    let userLikes: string[] = [];
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data: userLikesData } = await supabase
        .from("social_thread_likes")
        .select("thread_id")
        .eq("user_id", currentUser.id)
        .in("thread_id", threadIds);
      userLikes = userLikesData?.map(l => l.thread_id) || [];
    }

    const enrichedThreads: SocialThread[] = threadsData.map(thread => ({
      ...thread,
      profile: profileMap.get(thread.user_id) || null,
      likesCount: likesCountMap.get(thread.id) || 0,
      repliesCount: repliesCountMap.get(thread.id) || 0,
      isLiked: userLikes.includes(thread.id),
      hashtags: extractHashtags(thread.content),
    }));

    setThreads(enrichedThreads);
    setIsLoading(false);
  }, []);

  // Calculate trending hashtags
  const trendingTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    threads.forEach(thread => {
      thread.hashtags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [threads]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    INTEREST_CATEGORIES.forEach(cat => {
      const count = threads.filter(t => t.hashtags.includes(cat.hashtag)).length;
      counts.set(cat.hashtag, count);
    });
    return counts;
  }, [threads]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    let result = [...threads];
    
    // Category filter
    if (selectedCategory) {
      result = result.filter(t => t.hashtags.includes(selectedCategory));
    }
    
    // Search filter
    if (activeSearch) {
      const searchLower = activeSearch.toLowerCase();
      result = result.filter(t => 
        t.content.toLowerCase().includes(searchLower) ||
        t.profile?.username.toLowerCase().includes(searchLower) ||
        t.hashtags.some(tag => tag.includes(searchLower))
      );
    }
    
    // Sort
    if (feedType === "popular") {
      result.sort((a, b) => (b.likesCount + b.repliesCount) - (a.likesCount + a.repliesCount));
    }
    
    return result;
  }, [threads, selectedCategory, activeSearch, feedType]);

  const handlePostThread = async () => {
    if (!user || !newThread.trim()) return;

    setIsPosting(true);
    const { error } = await supabase.from("social_threads").insert({
      user_id: user.id,
      content: newThread.trim(),
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier votre message",
        variant: "destructive",
      });
    } else {
      setNewThread("");
      toast({
        title: "Publié !",
        description: "Votre message a été partagé",
      });
    }
    setIsPosting(false);
  };

  const handleLike = async (threadId: string, isLiked: boolean) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (isLiked) {
      await supabase
        .from("social_thread_likes")
        .delete()
        .eq("thread_id", threadId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("social_thread_likes")
        .insert({ thread_id: threadId, user_id: user.id });
    }

    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, isLiked: !isLiked, likesCount: isLiked ? t.likesCount - 1 : t.likesCount + 1 }
        : t
    ));
  };

  const handleDelete = async (threadId: string) => {
    const { error } = await supabase
      .from("social_threads")
      .delete()
      .eq("id", threadId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Supprimé",
        description: "Votre message a été supprimé",
      });
    }
  };

  const handleHashtagClick = (tag: string) => {
    setSelectedCategory(selectedCategory === tag ? null : tag);
  };

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const SidebarContent = () => (
    <div className="space-y-4">
      <TrendingHashtags 
        trendingTags={trendingTags}
        selectedTag={selectedCategory}
        onSelectTag={setSelectedCategory}
      />
      <CategorySidebar 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What are people saying?
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Liberté d'expression • Discussions ouvertes
              </p>
            </div>
            
            {/* Mobile filter button */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-4">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            )}
          </div>
          
          {/* Search bar */}
          <div className="pb-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Rechercher des discussions, #hashtags, utilisateurs..."
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            {/* Compose Section */}
            {user ? (
              <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
                <ComposeThread
                  userProfile={userProfile}
                  value={newThread}
                  onChange={setNewThread}
                  onSubmit={handlePostThread}
                  isPosting={isPosting}
                />
              </div>
            ) : (
              <div className="p-6 text-center bg-card rounded-xl border border-border mb-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-3">Connectez-vous pour participer aux discussions</p>
                <Button onClick={() => navigate("/auth")}>Se connecter</Button>
              </div>
            )}

            {/* Feed Tabs */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as "recent" | "popular")} className="w-full">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent h-12">
                  <TabsTrigger 
                    value="recent" 
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Récent
                  </TabsTrigger>
                  <TabsTrigger 
                    value="popular"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Populaire
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Active filter indicator */}
              {(selectedCategory || activeSearch) && (
                <div className="px-4 py-2 bg-primary/10 border-b border-border flex items-center justify-between">
                  <span className="text-sm text-primary">
                    {selectedCategory && `#${selectedCategory}`}
                    {selectedCategory && activeSearch && " • "}
                    {activeSearch && `"${activeSearch}"`}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setActiveSearch("");
                      setSearchQuery("");
                    }}
                    className="text-xs h-7"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              )}

              {/* Threads List */}
              <div className="divide-y divide-border/50">
                {isLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedCategory || activeSearch ? "Aucun résultat" : "Aucune discussion"}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedCategory || activeSearch 
                        ? "Essayez avec d'autres filtres ou termes de recherche"
                        : "Soyez le premier à lancer la conversation !"}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredThreads.map((thread, index) => (
                      <div key={thread.id}>
                        <ThreadCard
                          thread={thread}
                          currentUserId={user?.id || null}
                          isExpanded={expandedThread === thread.id}
                          onToggleExpand={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                          onLike={() => handleLike(thread.id, thread.isLiked)}
                          onDelete={() => handleDelete(thread.id)}
                          onHashtagClick={handleHashtagClick}
                          index={index}
                        />
                        
                        {/* Replies Section */}
                        <AnimatePresence>
                          {expandedThread === thread.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 pb-4 bg-secondary/20 border-b border-border"
                            >
                              <SocialThreadReplies 
                                threadId={thread.id} 
                                currentUserId={user?.id || null}
                                onReplyAdded={() => {
                                  setThreads(prev => prev.map(t => 
                                    t.id === thread.id 
                                      ? { ...t, repliesCount: t.repliesCount + 1 }
                                      : t
                                  ));
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop only */}
          {!isMobile && (
            <div className="w-80 shrink-0 space-y-4 sticky top-24 h-fit">
              <SidebarContent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatPeopleSay;
