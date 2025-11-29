import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, MessageSquare } from "lucide-react";

interface Thread {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
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

    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("news_id", newsId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les discussions",
        variant: "destructive",
      });
      return;
    }

    setThreads(data || []);
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
        description: "Votre message a été ajouté",
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground pr-8">{newsTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full">
          {/* Thread Input */}
          {user ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Partagez votre analyse neutre..."
                value={newThread}
                onChange={(e) => setNewThread(e.target.value)}
                className="min-h-[100px] bg-background border-border focus:border-primary resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!newThread.trim() || isLoading}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                  Publier
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
              Connectez-vous pour participer aux discussions
            </div>
          )}

          {/* Threads List */}
          <ScrollArea className="flex-1 pr-4">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                <p>Aucune discussion pour le moment</p>
                <p className="text-sm">Soyez le premier à partager votre analyse</p>
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 bg-primary/20">
                        <AvatarFallback className="text-primary">
                          {thread.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Utilisateur</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(thread.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{thread.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
