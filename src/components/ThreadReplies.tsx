import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  isLiked?: boolean;
  likeCount?: number;
}

interface ThreadRepliesProps {
  threadId: string;
  currentUserId: string | null;
}

export const ThreadReplies = ({ threadId, currentUserId }: ThreadRepliesProps) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
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
          isLiked: false,
          likeCount: Math.floor(Math.random() * 10),
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
      parent_reply_id: replyingTo?.id || null,
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
      setShowInput(false);
      fetchReplies();
    }
    setLoading(false);
  };

  const toggleLike = (replyId: string) => {
    setReplies(prev => prev.map(r => 
      r.id === replyId 
        ? { ...r, isLiked: !r.isLiked, likeCount: r.isLiked ? (r.likeCount || 1) - 1 : (r.likeCount || 0) + 1 }
        : r
    ));
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

  const ReplyItem = ({ reply, isNested = false }: { reply: Reply & { children?: Reply[] }; isNested?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isNested ? 'ml-12' : ''}`}
    >
      <div className="flex gap-3 py-3">
        {/* Connection line for nested */}
        {isNested && (
          <div className="absolute left-[32px] top-0 bottom-0 w-[2px] bg-border -translate-x-1/2" />
        )}
        
        <Avatar className={`flex-shrink-0 ${isNested ? 'h-8 w-8' : 'h-9 w-9'}`}>
          <AvatarImage src={reply.profiles?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs">
            {reply.profiles?.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-foreground truncate max-w-[100px]">
              {reply.profiles?.username || 'Utilisateur'}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              @{reply.profiles?.username || 'user'}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {formatDistanceToNow(new Date(reply.created_at), {
                addSuffix: false,
                locale: fr,
              })}
            </span>
            <div className="ml-auto flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Signaler</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Body */}
          <p className="text-foreground text-sm leading-relaxed break-words mt-0.5">
            {reply.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-6 mt-2">
            {currentUserId && (
              <button
                onClick={() => {
                  setReplyingTo({ id: reply.id, username: reply.profiles?.username || 'user' });
                  setShowInput(true);
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={() => toggleLike(reply.id)}
              className={`flex items-center gap-1 transition-colors text-xs ${
                reply.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${reply.isLiked ? 'fill-current' : ''}`} />
              {reply.likeCount ? <span>{reply.likeCount}</span> : null}
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {reply.children && reply.children.length > 0 && (
        <div className="relative">
          {reply.children.map((child) => (
            <ReplyItem key={child.id} reply={child} isNested />
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Reply Input */}
      {currentUserId && showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 pb-3 border-b border-border/50"
        >
          {replyingTo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>Réponse à</span>
              <span className="text-primary">@{replyingTo.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-5 px-1 text-xs"
              >
                ✕
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Votre réponse..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
              className="flex-1 bg-transparent border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <Button
              onClick={handleSubmitReply}
              disabled={!newReply.trim() || loading}
              size="sm"
              className="rounded-full px-4"
            >
              Répondre
            </Button>
          </div>
        </motion.div>
      )}

      {/* Show reply button if input is hidden */}
      {currentUserId && !showInput && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(true)}
          className="mb-3 text-primary hover:text-primary/80"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Ajouter une réponse
        </Button>
      )}

      {/* Replies List */}
      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune réponse pour le moment
        </p>
      ) : (
        <AnimatePresence>
          <div className="space-y-0">
            {organized.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
