import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HashtagBadgeProps {
  tag: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HashtagBadge = ({ tag, isActive, onClick, className }: HashtagBadgeProps) => {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg" 
          : "bg-secondary hover:bg-primary/20 text-foreground",
        className
      )}
      onClick={onClick}
    >
      #{tag}
    </Badge>
  );
};
