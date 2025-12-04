import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MapPin, Calendar, Tag, ExternalLink, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  coordinates: [number, number];
  news: NewsItem[];
}

// Extended coordinates mapping
const locationCoordinates: Record<string, [number, number]> = {
  'France': [2.3522, 46.6034],
  'Paris': [2.3522, 48.8566],
  'Lyon': [4.8357, 45.7640],
  'Marseille': [5.3698, 43.2965],
  'Toulouse': [1.4442, 43.6047],
  'Nice': [7.2620, 43.7102],
  'Bordeaux': [-0.5792, 44.8378],
  'États-Unis': [-95.7129, 37.0902],
  'USA': [-95.7129, 37.0902],
  'New York': [-74.0060, 40.7128],
  'Los Angeles': [-118.2437, 34.0522],
  'Washington': [-77.0369, 38.9072],
  'San Francisco': [-122.4194, 37.7749],
  'Chicago': [-87.6298, 41.8781],
  'Royaume-Uni': [-3.4360, 55.3781],
  'UK': [-3.4360, 55.3781],
  'Londres': [-0.1276, 51.5074],
  'London': [-0.1276, 51.5074],
  'Allemagne': [10.4515, 51.1657],
  'Berlin': [13.4050, 52.5200],
  'Munich': [11.5820, 48.1351],
  'Espagne': [-3.7038, 40.4168],
  'Madrid': [-3.7038, 40.4168],
  'Barcelone': [2.1734, 41.3851],
  'Italie': [12.4964, 41.9028],
  'Rome': [12.4964, 41.9028],
  'Milan': [9.1900, 45.4642],
  'Chine': [104.1954, 35.8617],
  'Pékin': [116.4074, 39.9042],
  'Beijing': [116.4074, 39.9042],
  'Shanghai': [121.4737, 31.2304],
  'Hong Kong': [114.1694, 22.3193],
  'Japon': [138.2529, 36.2048],
  'Tokyo': [139.6917, 35.6895],
  'Osaka': [135.5023, 34.6937],
  'Russie': [105.3188, 61.5240],
  'Moscou': [37.6173, 55.7558],
  'Moscow': [37.6173, 55.7558],
  'Brésil': [-51.9253, -14.2350],
  'Rio': [-43.1729, -22.9068],
  'São Paulo': [-46.6333, -23.5505],
  'Inde': [78.9629, 20.5937],
  'Mumbai': [72.8777, 19.0760],
  'New Delhi': [77.2090, 28.6139],
  'Australie': [133.7751, -25.2744],
  'Sydney': [151.2093, -33.8688],
  'Melbourne': [144.9631, -37.8136],
  'Canada': [-106.3468, 56.1304],
  'Toronto': [-79.3832, 43.6532],
  'Vancouver': [-123.1207, 49.2827],
  'Monde': [10, 25],
  'International': [10, 25],
  'Global': [10, 25],
  'Europe': [15.2551, 54.5260],
  'Asie': [100.6197, 34.0479],
  'Afrique': [21.7587, 1.6508],
  'Amérique': [-95.7129, 37.0902],
  'Moyen-Orient': [45.0792, 29.3117],
  'Océanie': [140.0188, -22.7359],
};

const getCoordinatesForLocation = (location: string): [number, number] => {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Direct match
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (normalizedLocation === key.toLowerCase()) {
      return coords;
    }
  }
  
  // Partial match
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (normalizedLocation.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedLocation)) {
      return coords;
    }
  }
  
  // Default to "Monde" coordinates with slight offset for uniqueness
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [
    locationCoordinates['Monde'][0] + (hash % 60) - 30,
    locationCoordinates['Monde'][1] + (hash % 30) - 15
  ];
};

const NewsMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationGroup | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setError('Token Mapbox non configuré. Veuillez ajouter MAPBOX_PUBLIC_TOKEN dans les secrets.');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Erreur lors de la récupération du token Mapbox');
      }
    };
    fetchToken();
  }, []);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false });
        
        if (error) throw error;
        setNews(data || []);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Group news by location
  const locationGroups: LocationGroup[] = React.useMemo(() => {
    const groups: Record<string, LocationGroup> = {};
    
    news.forEach((item) => {
      const location = item.location || 'Monde';
      if (!groups[location]) {
        groups[location] = {
          location,
          coordinates: getCoordinatesForLocation(location),
          news: [],
        };
      }
      groups[location].news.push(item);
    });
    
    return Object.values(groups);
  }, [news]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [10, 25],
      pitch: 30,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(26, 0, 51)',
        'high-color': 'rgb(168, 0, 255)',
        'horizon-blend': 0.1,
      });
    });

    // Auto rotation
    let userInteracting = false;
    const secondsPerRevolution = 300;

    function spinGlobe() {
      if (!map.current) return;
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < 3) {
        const center = map.current.getCenter();
        center.lng -= 360 / secondsPerRevolution;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', () => { spinGlobe(); });

    spinGlobe();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers
  useEffect(() => {
    if (!map.current || locationGroups.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    locationGroups.forEach((group) => {
      const el = document.createElement('div');
      el.className = 'news-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-12 h-12 rounded-full bg-[#A800FF] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#A800FF]/50 transition-all duration-300 group-hover:scale-125 group-hover:shadow-[#A800FF]/70">
            ${group.news.length}
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#A800FF]"></div>
          <div class="absolute inset-0 rounded-full bg-[#A800FF] animate-ping opacity-20"></div>
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedLocation(group);
        setSelectedNews(null);
        map.current?.flyTo({
          center: group.coordinates,
          zoom: 4,
          duration: 1500,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(group.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [locationGroups]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-destructive mb-4">{error}</p>
            <Link to="/">
              <Button variant="outline">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Carte des Actualités
          </h1>
          <p className="text-xs text-muted-foreground">
            {news.length} actualités dans {locationGroups.length} lieux
          </p>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* No news message */}
      {!loading && news.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Card className="max-w-sm pointer-events-auto">
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune actualité disponible</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location panel */}
      {selectedLocation && !selectedNews && (
        <div className="absolute bottom-0 left-0 right-0 md:right-auto md:left-4 md:bottom-4 md:w-96 z-20 animate-in slide-in-from-bottom duration-300">
          <Card className="bg-background/95 backdrop-blur-sm border-primary/20 rounded-t-2xl md:rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {selectedLocation.location}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLocation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedLocation.news.length} actualité{selectedLocation.news.length > 1 ? 's' : ''}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {selectedLocation.news.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setSelectedNews(item)}
                    >
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {item.category}
                      </Badge>
                      <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.published_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* News detail panel */}
      {selectedNews && (
        <div className="absolute bottom-0 left-0 right-0 md:right-auto md:left-4 md:bottom-4 md:w-[28rem] z-20 animate-in slide-in-from-bottom duration-300">
          <Card className="bg-background/95 backdrop-blur-sm border-primary/20 rounded-t-2xl md:rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNews(null)}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
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
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {selectedNews.category}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedNews.location}
                </Badge>
              </div>
              <h2 className="text-lg font-bold mb-3">{selectedNews.title}</h2>
              <ScrollArea className="h-40 mb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedNews.summary}
                </p>
              </ScrollArea>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
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
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:block">
        <Card className="bg-background/80 backdrop-blur-sm p-3">
          <p className="text-xs text-muted-foreground mb-2">Légende</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              N
            </div>
            <span className="text-xs">Nombre d'actualités</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewsMap;
