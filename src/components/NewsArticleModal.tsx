import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Bot, 
  RefreshCw,
  Share2,
  Bookmark,
  Copy,
  Check
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface NewsArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: {
    id: string;
    title: string;
    summary: string;
    category: string;
    location: string;
    publishedAt: string;
    sourceUrls: string[];
    imageUrl?: string;
  } | null;
}

export const NewsArticleModal = ({ isOpen, onClose, news }: NewsArticleModalProps) => {
  const { toast } = useToast();
  const [article, setArticle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && news && !article) {
      generateArticle();
    }
  }, [isOpen, news]);

  useEffect(() => {
    if (!isOpen) {
      setArticle(null);
      setGeneratedImage(null);
    }
  }, [isOpen]);

  const generateArticle = async () => {
    if (!news) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-full-article', {
        body: {
          title: news.title,
          summary: news.summary,
          sourceUrls: news.sourceUrls,
          category: news.category,
          location: news.location
        }
      });

      if (error) throw error;
      setArticle(data.article);
    } catch (err) {
      console.error('Error generating article:', err);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'article complet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUniqueImage = async () => {
    if (!news) return;
    
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-news-image', {
        body: {
          newsId: news.id,
          title: news.title,
          summary: news.summary,
          category: news.category
        }
      });

      if (error) throw error;
      setGeneratedImage(data.imageUrl || data.imageData);
      toast({
        title: "Image générée",
        description: "Une image unique a été créée pour cette actualité"
      });
    } catch (err) {
      console.error('Error generating image:', err);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyArticle = () => {
    if (article) {
      navigator.clipboard.writeText(article);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Article copié" });
    }
  };

  if (!news) return null;

  const timeAgo = formatDistanceToNow(new Date(news.publishedAt), {
    addSuffix: true,
    locale: fr,
  });

  const displayImage = generatedImage || news.imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Header Image */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bot className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Generate Image Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={generateUniqueImage}
              disabled={isGeneratingImage}
              className="absolute top-4 right-4 gap-2"
            >
              {isGeneratingImage ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              {isGeneratingImage ? "Génération..." : "Image IA"}
            </Button>
            
            {/* Category Badge */}
            <Badge 
              className="absolute bottom-4 left-4 bg-primary text-primary-foreground"
            >
              {news.category}
            </Badge>
          </div>

          <ScrollArea className="h-[calc(90vh-16rem)]">
            <div className="p-6 space-y-6">
              {/* Title */}
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold leading-tight">
                  {news.title}
                </DialogTitle>
              </DialogHeader>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{news.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{timeAgo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>Rédigé par Antik-IA</span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-muted-foreground italic">{news.summary}</p>
              </div>

              {/* Full Article */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Article complet par Antik-IA
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={copyArticle}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={generateArticle} disabled={isLoading}>
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                  </div>
                ) : article ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{article}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Cliquez sur régénérer pour charger l'article.
                  </p>
                )}
              </div>

              {/* Sources */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Sources ({news.sourceUrls.length})
                </h4>
                <div className="space-y-2">
                  {news.sourceUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span className="truncate">{new URL(url).hostname}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
