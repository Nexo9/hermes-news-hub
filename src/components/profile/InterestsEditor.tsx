import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABLE_INTERESTS = [
  { id: "politique", label: "Politique", emoji: "🏛️" },
  { id: "economie", label: "Économie", emoji: "📈" },
  { id: "technologie", label: "Technologie", emoji: "💻" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "sante", label: "Santé", emoji: "🏥" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "musique", label: "Musique", emoji: "🎵" },
  { id: "cinema", label: "Cinéma", emoji: "🎬" },
  { id: "litterature", label: "Littérature", emoji: "📚" },
  { id: "jeux_video", label: "Jeux Vidéo", emoji: "🎮" },
  { id: "voyage", label: "Voyage", emoji: "✈️" },
  { id: "gastronomie", label: "Gastronomie", emoji: "🍳" },
  { id: "mode", label: "Mode", emoji: "👗" },
  { id: "environnement", label: "Environnement", emoji: "🌍" },
  { id: "education", label: "Éducation", emoji: "🎓" },
  { id: "automobile", label: "Automobile", emoji: "🚗" },
  { id: "immobilier", label: "Immobilier", emoji: "🏠" },
  { id: "crypto", label: "Crypto & Blockchain", emoji: "₿" },
  { id: "ia", label: "Intelligence Artificielle", emoji: "🤖" },
];

interface InterestsEditorProps {
  interests: string[];
  onSave: (interests: string[]) => Promise<void>;
  isLoading?: boolean;
}

export const InterestsEditor = ({ interests, onSave, isLoading = false }: InterestsEditorProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(interests);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = JSON.stringify(selectedInterests.sort()) !== JSON.stringify(interests.sort());

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSave = async () => {
    if (selectedInterests.length < 3) return;
    setIsSaving(true);
    await onSave(selectedInterests);
    setIsSaving(false);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Centres d'intérêt</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Sélectionnez au moins 3 centres d'intérêt pour personnaliser votre fil d'actualités
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <AnimatePresence>
          {AVAILABLE_INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <motion.div
                key={interest.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer py-2 px-3 text-sm transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => toggleInterest(interest.id)}
                >
                  <span className="mr-1">{interest.emoji}</span>
                  {interest.label}
                  {isSelected && <Check className="h-3 w-3 ml-1" />}
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {selectedInterests.length} sélectionné{selectedInterests.length > 1 ? "s" : ""} 
          {selectedInterests.length < 3 && (
            <span className="text-amber-500 ml-1">(minimum 3)</span>
          )}
        </p>
        <Button 
          onClick={handleSave} 
          disabled={selectedInterests.length < 3 || !hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </Card>
  );
};
