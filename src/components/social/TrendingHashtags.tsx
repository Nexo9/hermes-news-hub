import { TrendingUp } from "lucide-react";
import { HashtagBadge } from "./HashtagBadge";
import { INTEREST_CATEGORIES } from "./CategorySidebar";

interface TrendingHashtagsProps {
  trendingTags: { tag: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TrendingHashtags = ({ 
  trendingTags, 
  selectedTag,
  onSelectTag 
}: TrendingHashtagsProps) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Tendances
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {trendingTags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucune tendance pour le moment
          </p>
        ) : (
          trendingTags.slice(0, 8).map(({ tag, count }) => (
            <div 
              key={tag} 
              className="flex items-center justify-between group cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${selectedTag === tag ? 'text-primary' : 'text-foreground group-hover:text-primary'} transition-colors`}>
                  #{tag}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {count} {count === 1 ? 'post' : 'posts'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
};

export const getValidHashtags = (): string[] => {
  return INTEREST_CATEGORIES.map(cat => cat.hashtag);
};

export const renderContentWithHashtags = (
  content: string, 
  onHashtagClick?: (tag: string) => void
): React.ReactNode => {
  const parts = content.split(/(#\w+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1).toLowerCase();
      return (
        <span 
          key={index}
          className="text-primary font-medium cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onHashtagClick?.(tag);
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};
