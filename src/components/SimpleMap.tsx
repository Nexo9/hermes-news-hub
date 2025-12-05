import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Tag, ExternalLink, X, Globe, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  published_at: string;
  source_urls: string[];
}

interface LocationGroup {
  location: string;
  x: number;
  y: number;
  news: NewsItem[];
}

// World map coordinates (simplified 2D projection)
const locationPositions: Record<string, { x: number; y: number }> = {
  // Europe
  'France': { x: 48, y: 35 },
  'Paris': { x: 48, y: 33 },
  'Allemagne': { x: 52, y: 32 },
  'Berlin': { x: 53, y: 31 },
  'Royaume-Uni': { x: 45, y: 28 },
  'UK': { x: 45, y: 28 },
  'Londres': { x: 45, y: 29 },
  'London': { x: 45, y: 29 },
  'Espagne': { x: 44, y: 40 },
  'Madrid': { x: 44, y: 40 },
  'Italie': { x: 52, y: 38 },
  'Rome': { x: 52, y: 38 },
  'Europe': { x: 50, y: 33 },
  
  // Americas
  'États-Unis': { x: 22, y: 38 },
  'USA': { x: 22, y: 38 },
  'New York': { x: 28, y: 36 },
  'Los Angeles': { x: 15, y: 40 },
  'Washington': { x: 27, y: 38 },
  'Canada': { x: 22, y: 28 },
  'Toronto': { x: 26, y: 32 },
  'Brésil': { x: 32, y: 62 },
  'Amérique': { x: 25, y: 45 },
  
  // Asia
  'Chine': { x: 75, y: 40 },
  'Pékin': { x: 76, y: 36 },
  'Beijing': { x: 76, y: 36 },
  'Shanghai': { x: 78, y: 42 },
  'Japon': { x: 82, y: 38 },
  'Tokyo': { x: 82, y: 38 },
  'Inde': { x: 68, y: 48 },
  'Russie': { x: 70, y: 25 },
  'Moscou': { x: 58, y: 28 },
  'Asie': { x: 72, y: 40 },
  'Moyen-Orient': { x: 60, y: 42 },
  
  // Africa & Oceania
  'Afrique': { x: 52, y: 55 },
  'Australie': { x: 82, y: 68 },
  'Sydney': { x: 85, y: 70 },
  'Océanie': { x: 85, y: 65 },
  
  // Global
  'Monde': { x: 50, y: 45 },
  'International': { x: 50, y: 50 },
  'Global': { x: 50, y: 42 },
};

const getPositionForLocation = (location: string): { x: number; y: number } => {
  const normalized = location.toLowerCase().trim();
  
  for (const [key, pos] of Object.entries(locationPositions)) {
    if (normalized === key.toLowerCase() || normalized.includes(key.toLowerCase())) {
      return pos;
    }
  }
  
  // Generate pseudo-random position based on location name
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    x: 20 + (hash % 60),
    y: 20 + (hash % 50),
  };
};

const SimpleMap = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};

    news.forEach((item) => {
      const location = item.location || "Monde";
      if (!groups[location]) {
        const pos = getPositionForLocation(location);
        groups[location] = {
          location,
          x: pos.x,
          y: pos.y,
          news: [],
        };
      }
      groups[location].news.push(item);
    });

    return Object.values(groups);
  }, [news]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0a0015] via-[#1A0033] to-[#0a0015] overflow-hidden">
      {/* World Map SVG Background */}
      <svg
        viewBox="0 0 100 70"
        className="absolute inset-0 w-full h-full opacity-20"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Simplified world map paths */}
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A800FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7B00CC" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* North America */}
        <path d="M10,20 Q20,15 30,25 L35,40 Q25,50 15,45 Q8,35 10,20" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* South America */}
        <path d="M25,48 Q35,45 35,55 L32,70 Q25,68 22,60 Q20,52 25,48" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* Europe */}
        <path d="M42,22 Q55,20 58,28 L55,38 Q48,40 42,35 Q40,28 42,22" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* Africa */}
        <path d="M45,40 Q55,38 58,45 L55,65 Q48,68 45,60 Q42,50 45,40" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* Asia */}
        <path d="M58,18 Q80,15 88,30 L85,50 Q70,55 60,45 Q55,30 58,18" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* Australia */}
        <path d="M78,58 Q88,55 90,62 L88,70 Q80,72 78,65 Q76,62 78,58" fill="url(#mapGradient)" stroke="#A800FF" strokeWidth="0.2" />
        
        {/* Grid lines */}
        {[...Array(10)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 7} x2="100" y2={i * 7} stroke="#A800FF" strokeWidth="0.05" opacity="0.3" />
        ))}
        {[...Array(14)].map((_, i) => (
          <line key={`v${i}`} x1={i * 7.14} y1="0" x2={i * 7.14} y2="70" stroke="#A800FF" strokeWidth="0.05" opacity="0.3" />
        ))}
      </svg>

      {/* News Markers */}
      <div className="absolute inset-0">
        {locationGroups.map((group) => (
          <motion.div
            key={group.location}
            className="absolute cursor-pointer"
            style={{
              left: `${group.x}%`,
              top: `${group.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            onClick={() => {
              setSelectedLocation(group);
              setSelectedNews(null);
            }}
            onMouseEnter={() => setHoveredLocation(group.location)}
            onMouseLeave={() => setHoveredLocation(null)}
          >
            <div className="relative">
              {/* Pulse animation */}
              <div className="absolute inset-0 w-12 h-12 -m-1.5 rounded-full bg-primary/30 animate-ping" />
              
              {/* Main marker */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/50 border-2 border-white/20">
                {group.news.length}
              </div>
              
              {/* Location label on hover */}
              <AnimatePresence>
                {hoveredLocation === group.location && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
                  >
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                      {group.location}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{news.length} actualités</p>
            <p className="text-xs text-muted-foreground">{locationGroups.length} lieux</p>
          </div>
        </div>
      </div>

      {/* Location Panel */}
      <AnimatePresence>
        {selectedLocation && !selectedNews && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-background/95 backdrop-blur-sm border-l border-border"
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {selectedLocation.location}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation.news.length} actualité{selectedLocation.news.length > 1 ? "s" : ""}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-140px)]">
                  <div className="space-y-3 pr-4">
                    {selectedLocation.news.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-primary/30"
                        onClick={() => setSelectedNews(item)}
                      >
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {item.category}
                        </Badge>
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.published_at)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News Detail Panel */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-full md:w-[28rem] bg-background/95 backdrop-blur-sm border-l border-border"
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNews(null)}
                    className="text-muted-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Retour
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedNews(null);
                      setSelectedLocation(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {selectedNews.category}
                  </Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedNews.location}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold mb-4">{selectedNews.title}</h2>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {selectedNews.summary}
                  </p>
                </ScrollArea>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedNews.published_at)}
                  </span>
                  {selectedNews.source_urls && selectedNews.source_urls.length > 0 && (
                    <a
                      href={selectedNews.source_urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Légende</p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-[10px]">
            N
          </div>
          <span className="text-xs text-muted-foreground">Nombre d'actualités</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;