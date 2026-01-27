import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Bot, 
  ExternalLink, 
  Newspaper,
  Globe,
  Loader2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface SearchResult {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  country: string;
}

interface SynthesizedResult {
  title: string;
  summary: string;
  fullArticle: string;
  sources: string[];
  category: string;
  sourceUrls: string[];
}

interface AdvancedSearchModalProps {
  trigger?: React.ReactNode;
}

export const AdvancedSearchModal = ({ trigger }: AdvancedSearchModalProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [synthesized, setSynthesized] = useState<SynthesizedResult | null>(null);
  const [sourcesCount, setSourcesCount] = useState(0);

  const handleSearch = async () => {
    if (query.length < 2) {
      toast({
        title: "Recherche trop courte",
        description: "Entrez au moins 2 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSynthesized(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-news-sources', {
        body: { query, synthesize: true }
      });

      if (error) throw error;

      setResults(data.results || []);
      setSynthesized(data.synthesized);
      setSourcesCount(data.sourcesSearched || 0);

      if (data.results?.length === 0) {
        toast({
          title: "Aucun résultat",
          description: "Essayez avec d'autres mots-clés"
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Recherche Avancée
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Recherche Multi-Sources avec Antik-IA
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Recherchez dans {sourcesCount || "20+"} journaux internationaux • Synthèse automatique par IA
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher un sujet d'actualité..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Rechercher
            </Button>
          </div>

          {/* Results */}
          {isSearching ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recherche dans {sourcesCount || "20+"} sources...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </Card>
                ))}
              </div>
            </div>
          ) : (results.length > 0 || synthesized) ? (
            <Tabs defaultValue="synthesized" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="synthesized" className="gap-2">
                  <Bot className="w-4 h-4" />
                  Synthèse Antik-IA
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-2">
                  <Newspaper className="w-4 h-4" />
                  Sources ({results.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="synthesized" className="mt-4">
                <ScrollArea className="h-[50vh]">
                  {synthesized ? (
                    <div className="space-y-4 pr-4">
                      <div className="space-y-2">
                        <Badge variant="secondary">{synthesized.category}</Badge>
                        <h2 className="text-xl font-bold">{synthesized.title}</h2>
                        <p className="text-muted-foreground italic">{synthesized.summary}</p>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{synthesized.fullArticle}</ReactMarkdown>
                      </div>

                      <div className="pt-4 border-t border-border space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          Sources utilisées:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {synthesized.sources?.map((source, idx) => (
                            <Badge key={idx} variant="outline">{source}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bot className="w-12 h-12 mb-4 opacity-50" />
                      <p>Aucune synthèse disponible</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sources" className="mt-4">
                <ScrollArea className="h-[50vh]">
                  <div className="grid grid-cols-1 gap-3 pr-4">
                    {results.map((result, idx) => (
                      <Card 
                        key={idx} 
                        className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.open(result.link, '_blank')}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.source}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {result.country}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {result.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {result.description}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">Entrez un terme de recherche</p>
              <p className="text-sm">
                Ex: "Ukraine", "Intelligence artificielle", "Économie France"
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
