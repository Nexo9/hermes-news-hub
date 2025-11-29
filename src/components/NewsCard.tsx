import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
}: NewsCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Card
      className="group relative overflow-hidden border-border bg-card hover:bg-card/80 
                 shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer
                 animate-fade-in"
      onClick={() => onViewThreads(id)}
    >
      {/* Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <Badge variant="secondary" className="shrink-0 bg-primary/20 text-primary border-primary/30">
            {category}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-muted-foreground leading-relaxed line-clamp-3">{summary}</p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
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

        {/* Sources */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <span className="font-medium">Sources:</span>
          <span className="truncate">{sourceUrls.length} sources vérifiées</span>
        </div>
      </div>
    </Card>
  );
};
