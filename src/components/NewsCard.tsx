import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, MapPin, Calendar, Heart, Bookmark, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareNewsDialog } from "@/components/ShareNewsDialog";

interface NewsCardProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  publishedAt: string;
  sourceUrls: string[];
  threadCount?: number;
  onViewThreads: (newsId: string) => void;
  userId?: string | null;
}

export const NewsCard = ({
  title,
  summary,
  category,
  location,
  publishedAt,
  sourceUrls,
  threadCount = 0,
  onViewThreads,
  id,
  userId,
}: NewsCardProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  });

  useEffect(() => {
    fetchInteractions();
  }, [id, userId]);

  const fetchInteractions = async () => {
    // Fetch likes count
    const { count } = await supabase
      .from("news_likes")
      .select("*", { count: "exact", head: true })
      .eq("news_id", id);
    
    setLikesCount(count || 0);

    if (!userId) return;

    // Check if user liked
    const { data: likeData } = await supabase
      .from("news_likes")
      .select("id")
      .eq("news_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setIsLiked(!!likeData);

    // Check if user favorited
    const { data: favData } = await supabase
      .from("news_favorites")
      .select("id")
      .eq("news_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setIsFavorited(!!favData);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour liker", variant: "destructive" });
      return;
    }

    if (isLiked) {
      await supabase.from("news_likes").delete().eq("news_id", id).eq("user_id", userId);
      setIsLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("news_likes").insert({ news_id: id, user_id: userId });
      setIsLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour enregistrer", variant: "destructive" });
      return;
    }

    if (isFavorited) {
      await supabase.from("news_favorites").delete().eq("news_id", id).eq("user_id", userId);
      setIsFavorited(false);
      toast({ title: "Retiré des favoris" });
    } else {
      await supabase.from("news_favorites").insert({ news_id: id, user_id: userId });
      setIsFavorited(true);
      toast({ title: "Ajouté aux favoris" });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour partager", variant: "destructive" });
      return;
    }
    setShowShareDialog(true);
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden border-border bg-card hover:bg-card/80 
                   shadow-card hover:shadow-glow transition-all duration-500 cursor-pointer
                   animate-fade-in hover:scale-[1.02] hover:-translate-y-1"
        onClick={() => onViewThreads(id)}
      >
        {/* Animated Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary group-hover:h-1.5 transition-all duration-300" />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />

        <div className="p-6 space-y-4 relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {title}
            </h3>
            <Badge variant="secondary" className="shrink-0 bg-primary/20 text-primary border-primary/30 animate-pulse-slow">
              {category}
            </Badge>
          </div>

          {/* Summary */}
          <p className="text-muted-foreground leading-relaxed line-clamp-3">{summary}</p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 group/loc">
              <MapPin className="w-4 h-4 text-primary group-hover/loc:scale-110 transition-transform" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>{threadCount} discussions</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1.5 transition-all duration-300 hover:scale-105 ${isLiked ? "text-red-500 hover:text-red-400" : "text-muted-foreground hover:text-red-500"}`}
            >
              <Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-current scale-110" : ""}`} />
              <span className="text-xs font-medium">{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`gap-1.5 transition-all duration-300 hover:scale-105 ${isFavorited ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Bookmark className={`w-4 h-4 transition-all ${isFavorited ? "fill-current scale-110" : ""}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <div className="flex-1 text-right text-xs text-muted-foreground">
              {sourceUrls.length} sources
            </div>
          </div>
        </div>
      </Card>

      <ShareNewsDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        newsId={id}
        newsTitle={title}
        userId={userId || ""}
      />
    </>
  );
};
