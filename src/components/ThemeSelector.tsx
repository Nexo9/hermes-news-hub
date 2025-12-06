import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Lock, Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Theme {
  id: string;
  name: string;
  description: string;
  primary: string;
  background: string;
  accent: string;
  premium: boolean;
}

const themes: Theme[] = [
  {
    id: "default",
    name: "HERMÈS Classic",
    description: "Le thème violet iconique d'HERMÈS",
    primary: "280 100% 50%",
    background: "260 100% 10%",
    accent: "280 100% 50%",
    premium: false,
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    description: "Un bleu profond et élégant",
    primary: "220 100% 50%",
    background: "220 50% 8%",
    accent: "220 100% 60%",
    premium: true,
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    description: "Vert émeraude apaisant",
    primary: "160 100% 40%",
    background: "160 50% 6%",
    accent: "160 100% 50%",
    premium: true,
  },
  {
    id: "sunset",
    name: "Golden Sunset",
    description: "Chaleureux orange doré",
    primary: "30 100% 50%",
    background: "20 30% 8%",
    accent: "40 100% 55%",
    premium: true,
  },
  {
    id: "rose",
    name: "Rose Gold",
    description: "Élégance rose et or",
    primary: "340 80% 55%",
    background: "340 20% 8%",
    accent: "340 90% 65%",
    premium: true,
  },
  {
    id: "cyber",
    name: "Cyberpunk",
    description: "Néon futuriste",
    primary: "180 100% 50%",
    background: "260 50% 5%",
    accent: "320 100% 60%",
    premium: true,
  },
];

interface ThemeSelectorProps {
  isPremium: boolean;
  isAdmin: boolean;
}

export function ThemeSelector({ isPremium, isAdmin }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem("hermes-theme") || "default";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--ring", theme.primary);
  };

  const handleThemeChange = async (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    // Check if user can use premium theme
    if (theme.premium && !isPremium && !isAdmin) {
      toast({
        title: "Thème Premium",
        description: "Passez à Premium ou Élite pour débloquer ce thème.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    localStorage.setItem("hermes-theme", themeId);
    setCurrentTheme(themeId);
    applyTheme(themeId);

    toast({
      title: "Thème appliqué",
      description: `Le thème "${theme.name}" a été activé.`,
    });

    setLoading(false);
  };

  const canUseTheme = (theme: Theme) => {
    return !theme.premium || isPremium || isAdmin;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Personnalisation du thème
        </CardTitle>
        <CardDescription>
          {isPremium || isAdmin 
            ? "Choisissez parmi tous les thèmes disponibles"
            : "Passez à Premium pour débloquer plus de thèmes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const isLocked = !canUseTheme(theme);
            const isActive = currentTheme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={loading}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all text-left",
                  isActive 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-border hover:border-primary/50",
                  isLocked && "opacity-60 cursor-not-allowed"
                )}
              >
                {/* Color Preview */}
                <div className="flex gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${theme.primary})` }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${theme.background})` }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ backgroundColor: `hsl(${theme.accent})` }}
                  />
                </div>

                <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                <p className="text-xs text-muted-foreground">{theme.description}</p>

                {/* Badges */}
                <div className="mt-3 flex items-center gap-2">
                  {theme.premium && (
                    <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {isActive && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  )}
                </div>

                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!isPremium && !isAdmin && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Débloquez tous les thèmes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Passez à Premium ou Élite pour accéder à tous les thèmes et personnaliser votre expérience HERMÈS.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}