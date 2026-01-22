import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Send,
  Loader2,
  TrendingUp,
  Users,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SocialThreadReplies } from "@/components/social/SocialThreadReplies";

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
}

const WhatPeopleSay = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [threads, setThreads] = useState<SocialThread[]>([]);
  const [newThread, setNewThread] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    fetchThreads();

    // Subscribe to realtime updates
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
      .limit(50);

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

    // Fetch profiles for all threads
    const userIds = [...new Set(threadsData.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Fetch likes counts
    const threadIds = threadsData.map(t => t.id);
    const { data: likesData } = await supabase
      .from("social_thread_likes")
      .select("thread_id")
      .in("thread_id", threadIds);

    const likesCountMap = new Map<string, number>();
    likesData?.forEach(like => {
      likesCountMap.set(like.thread_id, (likesCountMap.get(like.thread_id) || 0) + 1);
    });

    // Fetch replies counts
    const { data: repliesData } = await supabase
      .from("social_thread_replies")
      .select("thread_id")
      .in("thread_id", threadIds);

    const repliesCountMap = new Map<string, number>();
    repliesData?.forEach(reply => {
      repliesCountMap.set(reply.thread_id, (repliesCountMap.get(reply.thread_id) || 0) + 1);
    });

    // Check if current user liked each thread
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
    }));

    setThreads(enrichedThreads);
    setIsLoading(false);
  }, []);

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

    // Update local state
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What are people saying?
            </h1>
            <p className="text-sm text-muted-foreground">Liberté d'expression • Discussions ouvertes</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Compose Section */}
        {user ? (
          <div className="p-4 border-b border-border">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userProfile?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Qu'avez-vous à dire ?"
                  value={newThread}
                  onChange={(e) => setNewThread(e.target.value)}
                  className="min-h-24 resize-none border-0 focus-visible:ring-0 p-0 text-lg placeholder:text-muted-foreground/60"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{newThread.length}/500</span>
                  <Button 
                    onClick={handlePostThread} 
                    disabled={!newThread.trim() || isPosting}
                    className="gap-2"
                  >
                    {isPosting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Publier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border-b border-border bg-muted/30">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">Connectez-vous pour participer aux discussions</p>
            <Button onClick={() => navigate("/auth")}>Se connecter</Button>
          </div>
        )}

        {/* Trending Section */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Discussions récentes</span>
          </div>
        </div>

        {/* Threads List */}
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune discussion</h3>
              <p className="text-muted-foreground">Soyez le premier à lancer la conversation !</p>
            </div>
          ) : (
            <AnimatePresence>
              {threads.map((thread, index) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <article className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3">
                      <Avatar 
                        className="h-10 w-10 shrink-0 cursor-pointer"
                        onClick={() => thread.profile && navigate(`/profile/${thread.profile.username}`)}
                      >
                        <AvatarImage src={thread.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {thread.profile?.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="font-semibold hover:underline cursor-pointer"
                            onClick={() => thread.profile && navigate(`/profile/${thread.profile.username}`)}
                          >
                            @{thread.profile?.username || "anonyme"}
                          </span>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          {user?.id === thread.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(thread.id)}
                                  className="text-destructive"
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="mt-1 text-foreground whitespace-pre-wrap break-words">
                          {thread.content}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-6 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-primary"
                            onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{thread.repliesCount}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${thread.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                            onClick={() => handleLike(thread.id, thread.isLiked)}
                          >
                            <Heart className={`h-4 w-4 ${thread.isLiked ? 'fill-current' : ''}`} />
                            <span>{thread.likesCount}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-primary"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Replies Section */}
                        <AnimatePresence>
                          {expandedThread === thread.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 border-t border-border pt-4"
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
                    </div>
                  </article>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatPeopleSay;
