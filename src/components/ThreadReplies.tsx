import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Reply, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_reply_id: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface ThreadRepliesProps {
  threadId: string;
  currentUserId: string | null;
}

export const ThreadReplies = ({ threadId, currentUserId }: ThreadRepliesProps) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReplies();
  }, [threadId]);

  const fetchReplies = async () => {
    const { data: repliesData } = await supabase
      .from('thread_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (repliesData) {
      const userIds = [...new Set(repliesData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesData) {
        const profilesMap = new Map(profilesData.map(p => [p.id, p]));
        const repliesWithProfiles = repliesData.map(reply => ({
          ...reply,
          profiles: profilesMap.get(reply.user_id) || null,
        }));
        setReplies(repliesWithProfiles);
      }
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim() || !currentUserId) return;

    setLoading(true);
    const { error } = await supabase.from('thread_replies').insert({
      thread_id: threadId,
      user_id: currentUserId,
      content: newReply,
      parent_reply_id: replyingTo,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier la réponse",
        variant: "destructive",
      });
    } else {
      setNewReply("");
      setReplyingTo(null);
      fetchReplies();
      toast({
        title: "Réponse publiée",
        description: "Votre réponse a été ajoutée",
      });
    }
    setLoading(false);
  };

  const organizeReplies = (replies: Reply[]) => {
    const topLevel = replies.filter(r => !r.parent_reply_id);
    const nested = replies.filter(r => r.parent_reply_id);
    
    return topLevel.map(reply => ({
      ...reply,
      children: nested.filter(n => n.parent_reply_id === reply.id),
    }));
  };

  const organized = organizeReplies(replies);

  return (
    <div className="space-y-4 mt-4">
      <div className="border-t border-border pt-4">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Reply className="h-4 w-4" />
          Réponses ({replies.length})
        </h3>

        {currentUserId ? (
          <div className="space-y-2 mb-4">
            {replyingTo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Reply className="h-3 w-3" />
                Réponse à un commentaire
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-auto p-0 text-primary"
                >
                  Annuler
                </Button>
              </div>
            )}
            <Textarea
              placeholder="Votre réponse..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitReply}
                disabled={!newReply.trim() || loading}
                size="sm"
                className="gap-2"
              >
                <Send className="h-3 w-3" />
                Répondre
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Connectez-vous pour répondre
          </p>
        )}

        <div className="space-y-3">
          {organized.map((reply) => (
            <div key={reply.id} className="space-y-2">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      @{reply.profiles?.username || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{reply.content}</p>
                  {currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(reply.id)}
                      className="h-auto p-0 mt-2 text-xs text-primary"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Répondre
                    </Button>
                  )}
                </div>
              </div>

              {/* Nested replies */}
              {reply.children && reply.children.length > 0 && (
                <div className="ml-10 space-y-2">
                  {reply.children.map((child) => (
                    <div key={child.id} className="flex gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={child.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {child.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/20 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">
                            @{child.profiles?.username || 'Utilisateur'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(child.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground">{child.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};