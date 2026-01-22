import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Gamepad2, BookOpen, Palette, Laptop, Music, Film, 
  Globe, Briefcase, Heart, Leaf, Plane, Utensils, 
  GraduationCap, Dumbbell, Car, Home, Bitcoin, 
  Microscope, Scale, Sparkles, TrendingUp, Hash
} from "lucide-react";

export const INTEREST_CATEGORIES = [
  { id: "politique", label: "Politique", icon: Scale, hashtag: "politique" },
  { id: "economie", label: "Économie", icon: TrendingUp, hashtag: "economie" },
  { id: "technologie", label: "Technologie", icon: Laptop, hashtag: "tech" },
  { id: "science", label: "Science", icon: Microscope, hashtag: "science" },
  { id: "jeux_video", label: "Jeux Vidéo", icon: Gamepad2, hashtag: "gaming" },
  { id: "culture", label: "Culture", icon: Palette, hashtag: "culture" },
  { id: "litterature", label: "Littérature", icon: BookOpen, hashtag: "litterature" },
  { id: "musique", label: "Musique", icon: Music, hashtag: "musique" },
  { id: "cinema", label: "Cinéma", icon: Film, hashtag: "cinema" },
  { id: "sport", label: "Sport", icon: Dumbbell, hashtag: "sport" },
  { id: "voyage", label: "Voyage", icon: Plane, hashtag: "voyage" },
  { id: "gastronomie", label: "Gastronomie", icon: Utensils, hashtag: "food" },
  { id: "environnement", label: "Environnement", icon: Leaf, hashtag: "ecologie" },
  { id: "sante", label: "Santé", icon: Heart, hashtag: "sante" },
  { id: "education", label: "Éducation", icon: GraduationCap, hashtag: "education" },
  { id: "automobile", label: "Automobile", icon: Car, hashtag: "auto" },
  { id: "immobilier", label: "Immobilier", icon: Home, hashtag: "immobilier" },
  { id: "crypto", label: "Crypto", icon: Bitcoin, hashtag: "crypto" },
  { id: "international", label: "International", icon: Globe, hashtag: "monde" },
  { id: "business", label: "Business", icon: Briefcase, hashtag: "business" },
  { id: "ia", label: "Intelligence Artificielle", icon: Sparkles, hashtag: "ia" },
];

interface CategorySidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts?: Map<string, number>;
}

export const CategorySidebar = ({ 
  selectedCategory, 
  onSelectCategory,
  categoryCounts 
}: CategorySidebarProps) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Catégories
        </h3>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-10",
              selectedCategory === null && "bg-primary/20 text-primary"
            )}
            onClick={() => onSelectCategory(null)}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Tout</span>
          </Button>
          {INTEREST_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts?.get(cat.hashtag) || 0;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.hashtag ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  selectedCategory === cat.hashtag && "bg-primary/20 text-primary"
                )}
                onClick={() => onSelectCategory(cat.hashtag)}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left truncate">{cat.label}</span>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground">{count}</span>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
