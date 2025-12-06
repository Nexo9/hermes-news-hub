import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Tag, ExternalLink, X, Globe, ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";
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

// World map coordinates (simplified 2D projection with proper positions)
const locationPositions: Record<string, { x: number; y: number }> = {
  // Europe
  'France': { x: 47, y: 42 },
  'Paris': { x: 47, y: 41 },
  'Allemagne': { x: 50, y: 39 },
  'Berlin': { x: 52, y: 38 },
  'Royaume-Uni': { x: 44, y: 36 },
  'UK': { x: 44, y: 36 },
  'Londres': { x: 45, y: 37 },
  'London': { x: 45, y: 37 },
  'Espagne': { x: 44, y: 46 },
  'Madrid': { x: 44, y: 46 },
  'Italie': { x: 51, y: 44 },
  'Rome': { x: 51, y: 45 },
  'Europe': { x: 50, y: 40 },
  'Belgique': { x: 47, y: 39 },
  'Suisse': { x: 49, y: 42 },
  'Portugal': { x: 41, y: 46 },
  'Pologne': { x: 54, y: 38 },
  'Grèce': { x: 55, y: 48 },
  
  // Americas
  'États-Unis': { x: 22, y: 42 },
  'USA': { x: 22, y: 42 },
  'New York': { x: 27, y: 44 },
  'Los Angeles': { x: 15, y: 46 },
  'Washington': { x: 26, y: 45 },
  'Canada': { x: 22, y: 32 },
  'Toronto': { x: 26, y: 38 },
  'Brésil': { x: 32, y: 68 },
  'Amérique': { x: 25, y: 50 },
  'Mexique': { x: 18, y: 54 },
  'Argentine': { x: 30, y: 78 },
  'Chili': { x: 28, y: 76 },
  
  // Asia
  'Chine': { x: 78, y: 42 },
  'Pékin': { x: 79, y: 44 },
  'Beijing': { x: 79, y: 44 },
  'Shanghai': { x: 81, y: 48 },
  'Japon': { x: 86, y: 44 },
  'Tokyo': { x: 86, y: 44 },
  'Inde': { x: 70, y: 54 },
  'Russie': { x: 68, y: 28 },
  'Moscou': { x: 58, y: 34 },
  'Asie': { x: 75, y: 45 },
  'Moyen-Orient': { x: 60, y: 48 },
  'Israël': { x: 58, y: 50 },
  'Iran': { x: 62, y: 48 },
  'Corée du Sud': { x: 84, y: 44 },
  'Corée du Nord': { x: 83, y: 42 },
  'Vietnam': { x: 78, y: 56 },
  'Thaïlande': { x: 76, y: 58 },
  'Indonésie': { x: 80, y: 66 },
  
  // Africa
  'Afrique': { x: 52, y: 60 },
  'Égypte': { x: 56, y: 52 },
  'Maroc': { x: 43, y: 50 },
  'Algérie': { x: 47, y: 52 },
  'Tunisie': { x: 50, y: 50 },
  'Afrique du Sud': { x: 55, y: 76 },
  'Nigeria': { x: 49, y: 60 },
  'Kenya': { x: 58, y: 66 },
  
  // Oceania
  'Australie': { x: 84, y: 74 },
  'Sydney': { x: 86, y: 76 },
  'Océanie': { x: 88, y: 70 },
  'Nouvelle-Zélande': { x: 92, y: 80 },
  
  // Global
  'Monde': { x: 50, y: 50 },
  'International': { x: 50, y: 55 },
  'Global': { x: 50, y: 48 },
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
    y: 25 + (hash % 45),
  };
};

const SimpleMap = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

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
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
      {/* Detailed World Map SVG */}
      <div 
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg
          viewBox="0 0 100 90"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#0d2035" />
            </linearGradient>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a3050" />
              <stop offset="100%" stopColor="#0f2540" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Ocean background */}
          <rect x="0" y="0" width="100" height="90" fill="url(#oceanGradient)" />
          
          {/* Latitude/Longitude grid */}
          {[...Array(9)].map((_, i) => (
            <line key={`lat${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} stroke="#1a3050" strokeWidth="0.15" strokeDasharray="2,2" />
          ))}
          {[...Array(9)].map((_, i) => (
            <line key={`lng${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="90" stroke="#1a3050" strokeWidth="0.15" strokeDasharray="2,2" />
          ))}
          
          {/* NORTH AMERICA */}
          <path 
            d="M5,28 Q10,22 18,20 Q25,18 32,24 L35,30 Q34,35 30,40 L28,48 Q22,55 15,52 L10,48 Q5,42 4,35 L5,28" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          {/* Alaska */}
          <path 
            d="M5,20 Q8,18 12,19 L10,24 Q6,23 5,20" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          {/* Greenland */}
          <path 
            d="M35,15 Q42,12 45,18 L43,25 Q38,28 35,23 L35,15" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* CENTRAL AMERICA & CARIBBEAN */}
          <path 
            d="M18,52 Q22,54 20,58 L18,60 Q15,58 16,55 L18,52" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* SOUTH AMERICA */}
          <path 
            d="M22,60 Q28,58 32,62 L35,70 Q34,78 30,82 L26,80 Q22,76 24,70 L22,60" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          
          {/* EUROPE */}
          <path 
            d="M42,30 Q48,28 54,30 L58,34 Q56,40 52,42 L48,44 Q44,42 42,38 L42,30" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          {/* UK & Ireland */}
          <path 
            d="M42,32 Q44,30 45,33 L44,36 Q42,35 42,32" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          {/* Scandinavia */}
          <path 
            d="M50,22 Q54,20 56,25 L54,32 Q52,30 50,26 L50,22" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* AFRICA */}
          <path 
            d="M44,46 Q52,44 58,48 L62,55 Q60,68 55,75 L48,78 Q44,74 45,65 L44,55 L44,46" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          {/* Madagascar */}
          <path 
            d="M62,68 Q64,66 65,70 L63,74 Q61,72 62,68" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* ASIA */}
          <path 
            d="M58,26 Q70,22 82,28 L88,35 Q90,45 85,52 L78,58 Q70,60 65,54 L60,46 Q58,38 58,26" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          {/* Middle East */}
          <path 
            d="M58,44 Q62,42 66,46 L64,52 Q60,50 58,48 L58,44" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          {/* India */}
          <path 
            d="M66,48 Q72,46 74,52 L72,60 Q68,58 66,54 L66,48" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          {/* Japan */}
          <path 
            d="M86,38 Q88,36 89,40 L88,46 Q86,44 86,38" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* SOUTHEAST ASIA / INDONESIA */}
          <path 
            d="M76,60 Q82,58 86,62 L88,66 Q84,68 78,66 L76,60" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* AUSTRALIA */}
          <path 
            d="M78,68 Q88,66 92,72 L90,80 Q84,82 80,78 L78,72 L78,68" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.3"
            filter="url(#glow)"
          />
          {/* New Zealand */}
          <path 
            d="M94,78 Q96,76 96,80 L95,84 Q93,82 94,78" 
            fill="url(#landGradient)" 
            stroke="#2a4a70" 
            strokeWidth="0.2"
          />
          
          {/* Country/Region Labels */}
          <text x="20" y="38" fill="#4a7a9a" fontSize="1.8" fontWeight="bold">AMÉRIQUE</text>
          <text x="20" y="40" fill="#4a7a9a" fontSize="1.2">DU NORD</text>
          <text x="27" y="70" fill="#4a7a9a" fontSize="1.5" fontWeight="bold">AMÉRIQUE</text>
          <text x="27" y="72" fill="#4a7a9a" fontSize="1" >DU SUD</text>
          <text x="47" y="38" fill="#4a7a9a" fontSize="1.8" fontWeight="bold">EUROPE</text>
          <text x="50" y="62" fill="#4a7a9a" fontSize="1.8" fontWeight="bold">AFRIQUE</text>
          <text x="72" y="42" fill="#4a7a9a" fontSize="1.8" fontWeight="bold">ASIE</text>
          <text x="82" y="76" fill="#4a7a9a" fontSize="1.4" fontWeight="bold">AUSTRALIE</text>
          
          {/* Equator line */}
          <line x1="0" y1="55" x2="100" y2="55" stroke="#3a5a7a" strokeWidth="0.1" strokeDasharray="1,1" />
          <text x="2" y="54" fill="#3a5a7a" fontSize="0.8">Équateur</text>
        </svg>
      </div>

      {/* News Markers */}
      <div 
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        {locationGroups.map((group) => (
          <motion.div
            key={group.location}
            className="absolute cursor-pointer"
            style={{
              left: `${group.x}%`,
              top: `${group.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => {
              setSelectedLocation(group);
              setSelectedNews(null);
            }}
            onMouseEnter={() => setHoveredLocation(group.location)}
            onMouseLeave={() => setHoveredLocation(null)}
          >
            <div className="relative">
              {/* Outer pulse animation */}
              <div className="absolute inset-0 w-10 h-10 -m-1.5 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-0 w-8 h-8 -m-0.5 rounded-full bg-primary/30 animate-pulse" />
              
              {/* Main marker */}
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-primary via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white/30">
                {group.news.length}
              </div>
              
              {/* Location label on hover */}
              <AnimatePresence>
                {hoveredLocation === group.location && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap z-50"
                  >
                    <Badge className="bg-background/95 backdrop-blur-sm text-foreground border-primary/50 shadow-lg">
                      <MapPin className="h-3 w-3 mr-1 text-primary" />
                      {group.location}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.8))}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md rounded-xl px-5 py-3 border border-primary/30 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{news.length} actualités</p>
            <p className="text-sm text-muted-foreground">{locationGroups.length} localisations</p>
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-background/98 backdrop-blur-md border-l border-primary/30 z-30"
          >
            <Card className="h-full rounded-none border-0 bg-transparent">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg">{selectedLocation.location}</span>
                      <p className="text-sm text-muted-foreground font-normal">
                        {selectedLocation.news.length} actualité{selectedLocation.news.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(null)} className="hover:bg-destructive/20">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <div className="space-y-3 p-4">
                    {selectedLocation.news.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-xl bg-card/50 hover:bg-card cursor-pointer transition-all border border-transparent hover:border-primary/30 shadow-sm hover:shadow-md"
                        onClick={() => setSelectedNews(item)}
                      >
                        <Badge variant="secondary" className="mb-2 text-xs bg-primary/20 text-primary">
                          {item.category}
                        </Badge>
                        <h3 className="font-medium text-sm line-clamp-2 mb-2 leading-relaxed">{item.title}</h3>
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-full md:w-[28rem] bg-background/98 backdrop-blur-md border-l border-primary/30 z-30"
          >
            <Card className="h-full rounded-none border-0 bg-transparent">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNews(null)}
                    className="text-muted-foreground hover:text-foreground"
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
                    className="hover:bg-destructive/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <Tag className="h-3 w-3 mr-1" />
                    {selectedNews.category}
                  </Badge>
                  <Badge variant="outline" className="border-primary/30">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedNews.location}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold mb-4 leading-relaxed">{selectedNews.title}</h2>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap">
                    {selectedNews.summary}
                  </p>
                </ScrollArea>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedNews.published_at)}
                  </span>
                  {selectedNews.source_urls && selectedNews.source_urls.length > 0 && (
                    <a
                      href={selectedNews.source_urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir la source
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md rounded-xl p-4 border border-primary/30 shadow-lg z-20">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Légende</p>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary via-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
            N
          </div>
          <span className="text-xs text-muted-foreground">Nombre d'actualités par zone</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 opacity-70">Cliquez sur un point pour voir les détails</p>
      </div>
    </div>
  );
};

export default SimpleMap;