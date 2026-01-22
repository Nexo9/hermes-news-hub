import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Bookmark,
  Repeat2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renderContentWithHashtags } from "./TrendingHashtags";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ThreadCardProps {
  thread: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profile: Profile | null;
    likesCount: number;
    repliesCount: number;
    isLiked: boolean;
  };
  currentUserId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLike: () => void;
  onDelete: () => void;
  onHashtagClick: (tag: string) => void;
  index: number;
}

export const ThreadCard = ({
  thread,
  currentUserId,
  isExpanded,
  onToggleExpand,
  onLike,
  onDelete,
  onHashtagClick,
  index
}: ThreadCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group"
    >
      <div className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/50">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar 
            className="h-12 w-12 shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              thread.profile && navigate(`/profile/${thread.profile.username}`);
            }}
          >
            <AvatarImage src={thread.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold">
              {thread.profile?.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="font-bold hover:underline cursor-pointer text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  thread.profile && navigate(`/profile/${thread.profile.username}`);
                }}
              >
                {thread.profile?.username || "anonyme"}
              </span>
              <span className="text-muted-foreground text-sm">
                @{thread.profile?.username || "anonyme"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm hover:underline">
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: false, locale: fr })}
              </span>
              
              {/* Menu */}
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {currentUserId === thread.user_id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Body */}
            <p className="mt-2 text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {renderContentWithHashtags(thread.content, onHashtagClick)}
            </p>
            
            {/* Actions */}
            <div className="flex items-center justify-between mt-3 max-w-md">
              {/* Reply */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                <MessageCircle className={`h-[18px] w-[18px] ${isExpanded ? 'text-primary' : ''}`} />
                <span className={`text-sm ${isExpanded ? 'text-primary' : ''}`}>{thread.repliesCount || ""}</span>
              </Button>
              
              {/* Retweet */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full px-3"
              >
                <Repeat2 className="h-[18px] w-[18px]" />
              </Button>
              
              {/* Like */}
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full px-3 ${
                  thread.isLiked 
                    ? 'text-red-500 hover:bg-red-500/10' 
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
              >
                <Heart className={`h-[18px] w-[18px] transition-all ${thread.isLiked ? 'fill-current scale-110' : ''}`} />
                <span className="text-sm">{thread.likesCount || ""}</span>
              </Button>
              
              {/* Bookmark */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3"
              >
                <Bookmark className="h-[18px] w-[18px]" />
              </Button>
              
              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full px-3"
              >
                <Share2 className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
