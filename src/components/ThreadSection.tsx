import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, MessageSquare, Sparkles, Heart, Share2 } from "lucide-react";
import { ThreadReplies } from "./ThreadReplies";
import { motion, AnimatePresence } from "framer-motion";

interface Thread {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
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
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
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
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (!profilesError && profilesData) {
        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
        const threadsWithProfiles = threadsData.map(thread => ({
          ...thread,
          profiles: profilesMap.get(thread.user_id) || null,
        }));
        setThreads(threadsWithProfiles);
      } else {
        setThreads(threadsData.map(t => ({ ...t, profiles: null })));
      }
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
        description: "Votre analyse a été partagée",
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-gradient-to-b from-card to-card/95 border-primary/20">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold text-foreground pr-8 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {newsTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {threads.length} contribution{threads.length !== 1 ? "s" : ""} de la communauté
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full">
          {/* Thread Input */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-primary/10"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Partagez votre analyse neutre et constructive..."
                    value={newThread}
                    onChange={(e) => setNewThread(e.target.value)}
                    className="min-h-[80px] bg-background/50 border-border/50 focus:border-primary resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!newThread.trim() || isLoading}
                  className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <Send className="w-4 h-4" />
                  Publier
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-xl text-center text-muted-foreground border border-border/50">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Connectez-vous pour participer aux discussions
            </div>
          )}

          {/* Threads List */}
          <ScrollArea className="flex-1 pr-4 -mr-4">
            {threads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 opacity-50" />
                </div>
                <p className="font-medium">Aucune discussion pour le moment</p>
                <p className="text-sm">Soyez le premier à partager votre analyse</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {threads.map((thread, index) => (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="p-4 bg-gradient-to-r from-background to-background/80 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={thread.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                              {thread.profiles?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                                @{thread.profiles?.username || 'Utilisateur'}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(thread.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                              {thread.content}
                            </p>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-4 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-red-500"
                              >
                                <Heart className="h-4 w-4 mr-1" />
                                <span className="text-xs">J'aime</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-primary"
                                onClick={() => setExpandedThread(
                                  expandedThread === thread.id ? null : thread.id
                                )}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                <span className="text-xs">Répondre</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-blue-500"
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                <span className="text-xs">Partager</span>
                              </Button>
                            </div>
                            
                            {/* Thread Replies */}
                            <AnimatePresence>
                              {expandedThread === thread.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <ThreadReplies threadId={thread.id} currentUserId={user?.id || null} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
