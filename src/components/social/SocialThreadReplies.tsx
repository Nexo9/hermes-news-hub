import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, MoreHorizontal, Reply, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface SocialReply {
  id: string;
  thread_id: string;
  parent_reply_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  profile: Profile | null;
  likesCount: number;
  isLiked: boolean;
  children?: SocialReply[];
}

interface SocialThreadRepliesProps {
  threadId: string;
  currentUserId: string | null;
  onReplyAdded?: () => void;
}

export const SocialThreadReplies = ({ threadId, currentUserId, onReplyAdded }: SocialThreadRepliesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [replies, setReplies] = useState<SocialReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchReplies = useCallback(async () => {
    setIsLoading(true);
    
    const { data: repliesData, error } = await supabase
      .from("social_thread_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      setIsLoading(false);
      return;
    }

    if (!repliesData || repliesData.length === 0) {
      setReplies([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles
    const userIds = [...new Set(repliesData.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Fetch likes
    const replyIds = repliesData.map(r => r.id);
    const { data: likesData } = await supabase
      .from("social_reply_likes")
      .select("reply_id")
      .in("reply_id", replyIds);

    const likesCountMap = new Map<string, number>();
    likesData?.forEach(like => {
      likesCountMap.set(like.reply_id, (likesCountMap.get(like.reply_id) || 0) + 1);
    });

    // Check user likes
    let userLikes: string[] = [];
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from("social_reply_likes")
        .select("reply_id")
        .eq("user_id", currentUserId)
        .in("reply_id", replyIds);
      userLikes = userLikesData?.map(l => l.reply_id) || [];
    }

    // Build enriched replies
    const enrichedReplies: SocialReply[] = repliesData.map(reply => ({
      ...reply,
      profile: profileMap.get(reply.user_id) || null,
      likesCount: likesCountMap.get(reply.id) || 0,
      isLiked: userLikes.includes(reply.id),
    }));

    // Organize into tree structure
    const organized = organizeReplies(enrichedReplies);
    setReplies(organized);
    setIsLoading(false);
  }, [threadId, currentUserId]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const organizeReplies = (replies: SocialReply[]): SocialReply[] => {
    const replyMap = new Map<string, SocialReply>();
    const topLevel: SocialReply[] = [];

    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, children: [] });
    });

    replies.forEach(reply => {
      const enrichedReply = replyMap.get(reply.id)!;
      if (reply.parent_reply_id && replyMap.has(reply.parent_reply_id)) {
        replyMap.get(reply.parent_reply_id)!.children!.push(enrichedReply);
      } else {
        topLevel.push(enrichedReply);
      }
    });

    return topLevel;
  };

  const handlePostReply = async () => {
    if (!currentUserId || !newReply.trim()) return;

    setIsPosting(true);
    const { error } = await supabase.from("social_thread_replies").insert({
      thread_id: threadId,
      user_id: currentUserId,
      content: newReply.trim(),
      parent_reply_id: replyingTo?.id || null,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier votre réponse",
        variant: "destructive",
      });
    } else {
      setNewReply("");
      setReplyingTo(null);
      fetchReplies();
      onReplyAdded?.();
    }
    setIsPosting(false);
  };

  const handleLike = async (replyId: string, isLiked: boolean) => {
    if (!currentUserId) {
      navigate("/auth");
      return;
    }

    if (isLiked) {
      await supabase
        .from("social_reply_likes")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("social_reply_likes")
        .insert({ reply_id: replyId, user_id: currentUserId });
    }

    fetchReplies();
  };

  const handleDelete = async (replyId: string) => {
    const { error } = await supabase
      .from("social_thread_replies")
      .delete()
      .eq("id", replyId);

    if (!error) {
      fetchReplies();
    }
  };

  const ReplyItem = ({ reply, depth = 0 }: { reply: SocialReply; depth?: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}
    >
      <div className="flex gap-3 py-3">
        <Avatar 
          className="h-8 w-8 shrink-0 cursor-pointer"
          onClick={() => reply.profile && navigate(`/profile/${reply.profile.username}`)}
        >
          <AvatarImage src={reply.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {reply.profile?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="font-medium text-sm hover:underline cursor-pointer"
              onClick={() => reply.profile && navigate(`/profile/${reply.profile.username}`)}
            >
              @{reply.profile?.username || "anonyme"}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: fr })}
            </span>
            {currentUserId === reply.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleDelete(reply.id)}
                    className="text-destructive"
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{reply.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary"
              onClick={() => setReplyingTo({ id: reply.id, username: reply.profile?.username || "anonyme" })}
            >
              <Reply className="h-3 w-3" />
              Répondre
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 gap-1 text-xs ${reply.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
              onClick={() => handleLike(reply.id, reply.isLiked)}
            >
              <Heart className={`h-3 w-3 ${reply.isLiked ? 'fill-current' : ''}`} />
              {reply.likesCount > 0 && reply.likesCount}
            </Button>
          </div>
        </div>
      </div>
      {reply.children && reply.children.length > 0 && (
        <div className="space-y-1">
          {reply.children.map(child => (
            <ReplyItem key={child.id} reply={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Reply input */}
      {currentUserId && (
        <div className="space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              <Reply className="h-4 w-4" />
              <span>Réponse à @{replyingTo.username}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 ml-auto"
                onClick={() => setReplyingTo(null)}
              >
                Annuler
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ajouter une réponse..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              className="min-h-16 resize-none text-sm"
              maxLength={500}
            />
            <Button 
              onClick={handlePostReply} 
              disabled={!newReply.trim() || isPosting}
              size="icon"
              className="shrink-0"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Replies list */}
      {isLoading ? (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : replies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune réponse pour le moment
        </p>
      ) : (
        <AnimatePresence>
          {replies.map(reply => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};
