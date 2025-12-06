import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, Send, Terminal, Loader2, Sparkles, Globe, 
  Newspaper, Search, RefreshCw, CheckCircle2, XCircle 
} from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AntikIAPanelProps {
  userId: string;
}

export function AntikIAPanel({ userId }: AntikIAPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Bienvenue dans le terminal Antik-IA. Je suis votre assistant intelligent pour la gestion des actualités HERMÈS. Tapez une commande ou posez-moi une question.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("antik-ia-chat", {
        body: { message: input, userId },
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data?.response || "Je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeNews = async () => {
    if (!scrapeUrl.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL à scraper.",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);

    try {
      const response = await supabase.functions.invoke("scrape-news", {
        body: { url: scrapeUrl },
      });

      if (response.error) throw response.error;

      toast({
        title: "Scraping réussi",
        description: response.data?.message || "L'article a été ajouté avec succès.",
      });

      setScrapeUrl("");
      
      const successMessage: Message = {
        role: "system",
        content: `✅ Article scraped et ajouté: ${response.data?.title || scrapeUrl}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Error scraping:", error);
      toast({
        title: "Erreur de scraping",
        description: "Impossible de scraper cette URL.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Terminal Chat */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Terminal Antik-IA
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                  En ligne
                </Badge>
              </CardTitle>
              <CardDescription>Assistant IA pour la gestion des actualités</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="h-[400px] overflow-y-auto bg-black/50 rounded-lg p-4 font-mono text-sm mb-4 border border-primary/20"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${
                    msg.role === "user" 
                      ? "text-green-400" 
                      : msg.role === "system" 
                        ? "text-yellow-400" 
                        : "text-primary"
                  }`}>
                    {msg.role === "user" ? "admin@hermes:~$" : msg.role === "system" ? "[SYSTEM]" : "antik-ia:"}
                  </span>
                </div>
                <div className={`ml-4 mt-1 ${
                  msg.role === "assistant" ? "text-primary/90" : "text-foreground/80"
                } whitespace-pre-wrap`}>
                  {msg.content}
                </div>
                <div className="text-xs text-muted-foreground ml-4 mt-1">
                  {msg.timestamp.toLocaleTimeString("fr-FR")}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Antik-IA réfléchit...</span>
              </div>
            )}
          </div>

          {/* Quick Commands */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand("Quelles sont les dernières actualités ?")}
              className="text-xs"
            >
              <Newspaper className="h-3 w-3 mr-1" />
              Dernières news
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand("Génère un résumé des actualités du jour")}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Résumé du jour
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand("Recherche des actualités sur la technologie")}
              className="text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              Rechercher
            </Button>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Entrez une commande ou une question..."
                className="pl-10 bg-background/50 border-primary/30 font-mono"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSendMessage} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scraping & Actions */}
      <div className="space-y-6">
        {/* News Scraper */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Scraper d'actualités
            </CardTitle>
            <CardDescription>Ajoutez de nouvelles actualités depuis une URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="https://example.com/article..."
                className="flex-1"
                disabled={isScraping}
              />
              <Button onClick={handleScrapeNews} disabled={isScraping}>
                {isScraping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Antik-IA analysera l'article et générera un résumé neutre automatiquement.
            </p>
          </CardContent>
        </Card>

        {/* AI Status */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              État d'Antik-IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Modèle IA</span>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400">Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Synthèse extractive</span>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400">Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Scraping automatique</span>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400">Actif</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Capacités</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                Génération de résumés neutres
              </li>
              <li className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5" />
                Scraping d'articles web
              </li>
              <li className="flex items-start gap-2">
                <Search className="h-4 w-4 text-primary mt-0.5" />
                Recherche intelligente
              </li>
              <li className="flex items-start gap-2">
                <Newspaper className="h-4 w-4 text-primary mt-0.5" />
                Classification automatique
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}