import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface NewsRefreshTimerProps {
  onRefresh: () => void;
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function NewsRefreshTimer({ onRefresh }: NewsRefreshTimerProps) {
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL_MS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const { toast } = useToast();

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRefresh = useCallback(async (isManual: boolean = false) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news-rss');
      
      if (error) throw error;
      
      if (data?.success) {
        setLastRefresh(new Date());
        setTimeLeft(REFRESH_INTERVAL_MS);
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 3000);
        
        toast({
          title: "Actualités mises à jour",
          description: `${data.count || 0} nouvelles actualités ajoutées`,
        });
        
        onRefresh();
      } else {
        throw new Error(data?.error || 'Échec de la mise à jour');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      if (isManual) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour les actualités",
          variant: "destructive",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, toast]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          handleRefresh(false);
          return REFRESH_INTERVAL_MS;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  const progress = ((REFRESH_INTERVAL_MS - timeLeft) / REFRESH_INTERVAL_MS) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Timer Badge */}
      <AnimatePresence mode="wait">
        {justRefreshed ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 gap-1.5 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mis à jour
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/30 gap-1.5 px-3 py-1 relative overflow-hidden"
            >
              {/* Progress bar background */}
              <div 
                className="absolute inset-0 bg-primary/20 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
              <Clock className="h-3.5 w-3.5 relative z-10" />
              <span className="font-mono text-xs relative z-10">{formatTime(timeLeft)}</span>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRefresh(true)}
        disabled={isRefreshing}
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isRefreshing ? "Mise à jour..." : "Actualiser"}
        </span>
      </Button>

      {/* Last refresh info */}
      {lastRefresh && (
        <span className="text-xs text-muted-foreground hidden md:block">
          Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
