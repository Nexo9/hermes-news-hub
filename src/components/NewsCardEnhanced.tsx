import { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  Bot
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShareNewsDialog } from "@/components/ShareNewsDialog";
import { NewsArticleModal } from "@/components/NewsArticleModal";
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

// Generate a unique hash from string for consistent image selection
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

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
  const [showArticleModal, setShowArticleModal] = useState(false);

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

  // Generate a unique contextual image based on title, category, and unique ID
  const getContextualImage = useMemo(() => {
    const titleLower = title.toLowerCase();
    const titleHash = hashString(id + title);
    
    // Extended image pools for each category/keyword with multiple variations
    const imagePool: Record<string, string[]> = {
      // Politics
      'politics': [
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1575540325876-2f5561929f40?w=600&h=400&fit=crop',
      ],
      'usa': [
        'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1569431059717-d5abdf9e8c38?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1422464804701-7d8356b3a42f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1508433957232-3107f5fd5995?w=600&h=400&fit=crop',
      ],
      'france': [
        'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=600&h=400&fit=crop',
      ],
      'war': [
        'https://images.unsplash.com/photo-1580752300992-559f8e9ce92e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=400&fit=crop',
      ],
      'ukraine': [
        'https://images.unsplash.com/photo-1589519160732-576f165b9adb?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1561542320-9a18cd340e98?w=600&h=400&fit=crop',
      ],
      // Economy
      'economy': [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1559526324-593bc073d938?w=600&h=400&fit=crop',
      ],
      'crypto': [
        'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=600&h=400&fit=crop',
      ],
      // Technology
      'tech': [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop',
      ],
      'ai': [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1676299081847-824916de030a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1684379871666-7adff75ff0f5?w=600&h=400&fit=crop',
      ],
      'apple': [
        'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
      ],
      // Environment
      'climate': [
        'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&h=400&fit=crop',
      ],
      // Health
      'health': [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=400&fit=crop',
      ],
      // Sports
      'sport': [
        'https://images.unsplash.com/photo-1461896836934-480b9e29c72f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop',
      ],
      // Culture
      'culture': [
        'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=600&h=400&fit=crop',
      ],
      // Science
      'science': [
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&h=400&fit=crop',
      ],
      // Default / Other
      'default': [
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1586339949216-35c2747cc36d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&h=400&fit=crop',
      ],
    };

    // Keyword detection with priority
    const keywordMapping: [string[], string][] = [
      [['trump', 'biden', 'états-unis', 'usa', 'amérique', 'washington', 'maison blanche'], 'usa'],
      [['macron', 'france', 'paris', 'élysée', 'assemblée', 'français'], 'france'],
      [['ukraine', 'russie', 'poutine', 'zelensky', 'kiev', 'moscou'], 'ukraine'],
      [['guerre', 'conflit', 'militaire', 'armée', 'défense', 'otan'], 'war'],
      [['ia', 'intelligence artificielle', 'chatgpt', 'openai', 'gemini', 'claude'], 'ai'],
      [['apple', 'iphone', 'mac', 'ipad'], 'apple'],
      [['bitcoin', 'crypto', 'ethereum', 'blockchain'], 'crypto'],
      [['climat', 'réchauffement', 'environnement', 'cop', 'écologie'], 'climate'],
      [['santé', 'médecin', 'hôpital', 'vaccin', 'covid', 'virus'], 'health'],
      [['football', 'tennis', 'olympique', 'sport', 'jo', 'fifa'], 'sport'],
      [['cinéma', 'film', 'musique', 'concert', 'art', 'culture'], 'culture'],
      [['science', 'recherche', 'découverte', 'espace', 'nasa'], 'science'],
      [['économie', 'bourse', 'finance', 'inflation', 'banque'], 'economy'],
      [['technologie', 'tech', 'innovation', 'startup', 'numérique'], 'tech'],
    ];

    // Find matching category from keywords
    let matchedCategory = 'default';
    for (const [keywords, cat] of keywordMapping) {
      if (keywords.some(kw => titleLower.includes(kw))) {
        matchedCategory = cat;
        break;
      }
    }

    // Fallback to category-based if no keyword match
    if (matchedCategory === 'default') {
      const categoryLower = category.toLowerCase();
      if (categoryLower.includes('politique')) matchedCategory = 'politics';
      else if (categoryLower.includes('économie')) matchedCategory = 'economy';
      else if (categoryLower.includes('technologie')) matchedCategory = 'tech';
      else if (categoryLower.includes('sport')) matchedCategory = 'sport';
      else if (categoryLower.includes('culture')) matchedCategory = 'culture';
      else if (categoryLower.includes('science')) matchedCategory = 'science';
      else if (categoryLower.includes('santé')) matchedCategory = 'health';
      else if (categoryLower.includes('environnement')) matchedCategory = 'climate';
    }

    // Get image pool and select based on hash (ensures same news always gets same image)
    const pool = imagePool[matchedCategory] || imagePool['default'];
    const imageIndex = titleHash % pool.length;
    
    return pool[imageIndex];
  }, [id, title, category]);

  const displayImage = imageUrl || getContextualImage;

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

            {/* View Full Article Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowArticleModal(true);
              }}
              className="h-8 px-2 text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 gap-1"
            >
              <Bot className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Article</span>
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

      <NewsArticleModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        news={{
          id,
          title,
          summary,
          category,
          location,
          publishedAt,
          sourceUrls,
          imageUrl: displayImage
        }}
      />
    </>
  );
};
