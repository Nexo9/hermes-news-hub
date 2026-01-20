import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageCircle, MoreHorizontal, Heart, Repeat2, Share, Bookmark, X } from "lucide-react";
import { ThreadReplies } from "./ThreadReplies";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Thread {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  replyCount?: number;
  likeCount?: number;
  isLiked?: boolean;
}

interface ThreadSectionProps {
  newsId: string | null;
  newsTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ThreadSection = ({ newsId, newsTitle, isOpen, onClose }: ThreadSectionProps) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThread, setNewThread] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (newsId && isOpen) {
      fetchThreads();
    }
  }, [newsId, isOpen]);

  const fetchThreads = async () => {
    if (!newsId) return;

    const { data: threadsData, error: threadsError } = await supabase
      .from("threads")
      .select("*")
      .eq("news_id", newsId)
      .order("created_at", { ascending: false });

    if (threadsError) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les discussions",
        variant: "destructive",
      });
      return;
    }

    if (threadsData && threadsData.length > 0) {
      const userIds = [...new Set(threadsData.map(t => t.user_id))];
      const threadIds = threadsData.map(t => t.id);

      const [profilesResult, repliesCountResult] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url").in("id", userIds),
        supabase.from("thread_replies").select("thread_id").in("thread_id", threadIds),
      ]);

      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
      
      // Count replies per thread
      const replyCountMap = new Map<string, number>();
      repliesCountResult.data?.forEach(r => {
        replyCountMap.set(r.thread_id, (replyCountMap.get(r.thread_id) || 0) + 1);
      });

      const threadsWithProfiles = threadsData.map(thread => ({
        ...thread,
        profiles: profilesMap.get(thread.user_id) || null,
        replyCount: replyCountMap.get(thread.id) || 0,
        likeCount: Math.floor(Math.random() * 50), // Placeholder for likes
        isLiked: false,
      }));
      setThreads(threadsWithProfiles);
    } else {
      setThreads([]);
    }
  };

  const handleSubmit = async () => {
    if (!newThread.trim() || !newsId || !user) return;

    setIsLoading(true);

    const { error } = await supabase.from("threads").insert({
      news_id: newsId,
      user_id: user.id,
      content: newThread,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier votre message",
        variant: "destructive",
      });
    } else {
      setNewThread("");
      fetchThreads();
      toast({
        title: "Publié",
        description: "Votre commentaire a été partagé",
      });
    }

    setIsLoading(false);
  };

  const toggleLike = (threadId: string) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, isLiked: !t.isLiked, likeCount: t.isLiked ? (t.likeCount || 1) - 1 : (t.likeCount || 0) + 1 }
        : t
    ));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 bg-background border-l border-border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Commentaires</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onClose()} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 pr-8">{newsTitle}</p>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Compose Tweet Box */}
          {user && (
            <div className="p-4 border-b border-border">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userProfile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Textarea
                    placeholder="Partagez votre analyse..."
                    value={newThread}
                    onChange={(e) => setNewThread(e.target.value)}
                    className="min-h-[80px] border-0 bg-transparent resize-none focus-visible:ring-0 p-0 text-base placeholder:text-muted-foreground/60"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!newThread.trim() || isLoading}
                      size="sm"
                      className="rounded-full px-4"
                    >
                      {isLoading ? "Publication..." : "Publier"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div className="p-6 border-b border-border text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">Connectez-vous pour participer</p>
            </div>
          )}

          {/* Threads List */}
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-medium">Aucun commentaire</p>
              <p className="text-sm mt-1">Soyez le premier à commenter</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {threads.map((thread, index) => (
                <motion.article
                  key={thread.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border hover:bg-accent/5 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={thread.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm">
                          {thread.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-semibold text-foreground truncate max-w-[120px]">
                            {thread.profiles?.username || 'Utilisateur'}
                          </span>
                          <span className="text-muted-foreground truncate">
                            @{thread.profiles?.username || 'user'}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {formatDistanceToNow(new Date(thread.created_at), {
                              addSuffix: false,
                              locale: fr,
                            })}
                          </span>
                          <div className="ml-auto flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Signaler</DropdownMenuItem>
                                <DropdownMenuItem>Copier le lien</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Body */}
                        <p className="text-foreground mt-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                          {thread.content}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 max-w-[400px]">
                          <button
                            onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
                          >
                            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors -ml-2">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                            <span className="text-xs">{thread.replyCount || ''}</span>
                          </button>

                          <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500 transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                              <Repeat2 className="h-4 w-4" />
                            </div>
                          </button>

                          <button
                            onClick={() => toggleLike(thread.id)}
                            className={`flex items-center gap-1 transition-colors group ${
                              thread.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                            }`}
                          >
                            <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                              <Heart className={`h-4 w-4 ${thread.isLiked ? 'fill-current' : ''}`} />
                            </div>
                            <span className="text-xs">{thread.likeCount || ''}</span>
                          </button>

                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                              <Bookmark className="h-4 w-4" />
                            </div>
                          </button>

                          <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                              <Share className="h-4 w-4" />
                            </div>
                          </button>
                        </div>

                        {/* Thread Replies */}
                        <AnimatePresence>
                          {expandedThread === thread.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <ThreadReplies threadId={thread.id} currentUserId={user?.id || null} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
