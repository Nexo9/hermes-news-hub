import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Heart, 
  Bookmark, 
  Share2, 
  ExternalLink,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareNewsDialog } from "@/components/ShareNewsDialog";
import { motion, AnimatePresence } from "framer-motion";

interface NewsCardEnhancedProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  publishedAt: string;
  sourceUrls: string[];
  imageUrl?: string;
  threadCount?: number;
  onViewThreads: (newsId: string) => void;
  userId?: string | null;
}

export const NewsCardEnhanced = ({
  title,
  summary,
  category,
  location,
  publishedAt,
  sourceUrls,
  imageUrl,
  threadCount = 0,
  onViewThreads,
  id,
  userId,
}: NewsCardEnhancedProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  });

  useEffect(() => {
    fetchInteractions();
  }, [id, userId]);

  const fetchInteractions = async () => {
    const { count } = await supabase
      .from("news_likes")
      .select("*", { count: "exact", head: true })
      .eq("news_id", id);
    
    setLikesCount(count || 0);

    if (!userId) return;

    const { data: likeData } = await supabase
      .from("news_likes")
      .select("id")
      .eq("news_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    
    setIsLiked(!!likeData);

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

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const toggleSources = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSources(!showSources);
  };

  // Generate a placeholder image based on category
  const getPlaceholderImage = () => {
    const categoryImages: Record<string, string> = {
      'politique': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=200&fit=crop',
      'économie': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
      'technologie': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop',
      'sport': 'https://images.unsplash.com/photo-1461896836934- voices?w=400&h=200&fit=crop',
      'culture': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=200&fit=crop',
      'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=200&fit=crop',
      'santé': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      'environnement': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop',
    };
    const lowerCategory = category.toLowerCase();
    return categoryImages[lowerCategory] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop';
  };

  const displayImage = imageUrl || getPlaceholderImage();

  return (
    <>
      <Card
        className="group relative overflow-hidden border-border bg-card hover:bg-card/80 
                   shadow-card hover:shadow-glow transition-all duration-500 cursor-pointer
                   animate-fade-in hover:scale-[1.02] hover:-translate-y-1"
        onClick={() => onViewThreads(id)}
      >
        {/* News Image */}
        <div className="relative h-44 overflow-hidden">
          <img 
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Category Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0 shadow-lg"
          >
            {category}
          </Badge>
          
          {/* Source count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <ExternalLink className="w-3 h-3" />
            {sourceUrls.length} sources
          </div>
        </div>

        <div className="p-5 space-y-3 relative">
          {/* Glow effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
            {title}
          </h3>

          {/* Summary - Expandable */}
          <div className="relative">
            <p className={`text-muted-foreground text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {summary}
            </p>
            {summary.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpand}
                className="mt-1 h-6 px-2 text-xs text-primary hover:text-primary/80"
              >
                {isExpanded ? (
                  <>Voir moins <ChevronUp className="ml-1 h-3 w-3" /></>
                ) : (
                  <>Voir plus <ChevronDown className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>{threadCount}</span>
            </div>
          </div>

          {/* Sources dropdown */}
          <AnimatePresence>
            {showSources && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Sources :</p>
                  {sourceUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{new URL(url).hostname}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-1 h-8 px-2 transition-all duration-300 hover:scale-105 ${isLiked ? "text-red-500 hover:text-red-400" : "text-muted-foreground hover:text-red-500"}`}
            >
              <Heart className={`w-4 h-4 transition-all ${isLiked ? "fill-current scale-110" : ""}`} />
              <span className="text-xs font-medium">{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`h-8 px-2 transition-all duration-300 hover:scale-105 ${isFavorited ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Bookmark className={`w-4 h-4 transition-all ${isFavorited ? "fill-current scale-110" : ""}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSources}
              className="h-8 px-2 text-muted-foreground hover:text-primary ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
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
