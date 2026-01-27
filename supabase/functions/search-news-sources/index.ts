import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extended list of news sources (RSS feeds)
const NEWS_SOURCES = [
  // French Sources
  { url: 'https://www.lemonde.fr/rss/une.xml', name: 'Le Monde', country: 'France' },
  { url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', name: 'Le Figaro', country: 'France' },
  { url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', name: 'Libération', country: 'France' },
  { url: 'https://www.francetvinfo.fr/titres.rss', name: 'France Info', country: 'France' },
  { url: 'https://www.20minutes.fr/feeds/rss-une.xml', name: '20 Minutes', country: 'France' },
  { url: 'https://www.rfi.fr/fr/rss', name: 'RFI', country: 'France' },
  { url: 'https://www.france24.com/fr/rss', name: 'France 24', country: 'France' },
  
  // International - English
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', country: 'UK' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NY Times', country: 'USA' },
  { url: 'https://feeds.washingtonpost.com/rss/world', name: 'Washington Post', country: 'USA' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian', country: 'UK' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', country: 'Qatar' },
  { url: 'https://feeds.reuters.com/reuters/worldNews', name: 'Reuters', country: 'International' },
  
  // European Sources
  { url: 'https://www.spiegel.de/schlagzeilen/index.rss', name: 'Der Spiegel', country: 'Germany' },
  { url: 'https://elpais.com/rss/elpais/portada.xml', name: 'El País', country: 'Spain' },
  { url: 'https://www.corriere.it/rss/homepage.xml', name: 'Corriere della Sera', country: 'Italy' },
  
  // Tech & Science
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', country: 'USA' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', country: 'USA' },
  { url: 'https://www.nature.com/nature.rss', name: 'Nature', country: 'UK' },
];

interface SearchResult {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  country: string;
}

async function fetchAndSearchRSS(feed: typeof NEWS_SOURCES[0], query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': 'HERMES-Search-Bot/1.0' }
    });
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      
      const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
      const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
      
      // Check if query matches
      if (cleanTitle.toLowerCase().includes(queryLower) || 
          cleanDesc.toLowerCase().includes(queryLower)) {
        results.push({
          title: cleanTitle,
          description: cleanDesc.slice(0, 300),
          link,
          pubDate,
          source: feed.name,
          country: feed.country
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, synthesize = true } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: "Query too short" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Searching news sources for: ${query}`);

    // Search all sources in parallel
    const searchPromises = NEWS_SOURCES.map(feed => fetchAndSearchRSS(feed, query));
    const allResults = (await Promise.all(searchPromises)).flat();
    
    console.log(`Found ${allResults.length} matching articles`);

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], synthesized: null }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If synthesize is true, create a synthesized article from top results
    let synthesized = null;
    if (synthesize && allResults.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        const topResults = allResults.slice(0, 5);
        
        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `Tu es Antik-IA, le synthétiseur d'actualités de HERMÈS. 
Crée une synthèse neutre et complète des articles trouvés sur le sujet recherché.
Cite toujours les sources.
Sois factuel et objectif.`
                },
                {
                  role: "user",
                  content: `Recherche: "${query}"

Articles trouvés:
${topResults.map((r, i) => `
${i + 1}. ${r.source} (${r.country}):
Titre: ${r.title}
Résumé: ${r.description}
`).join('\n')}

Crée une synthèse complète de ces informations en format JSON:
{
  "title": "Titre de synthèse",
  "summary": "Résumé en 2-3 phrases",
  "fullArticle": "Article complet et détaillé (5-10 paragraphes)",
  "sources": ["liste des sources citées"],
  "category": "catégorie appropriée"
}`
                }
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              synthesized = JSON.parse(jsonMatch[0]);
              synthesized.sourceUrls = topResults.map(r => r.link);
            }
          }
        } catch (e) {
          console.error("Synthesis error:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: allResults.slice(0, 20),
        synthesized,
        sourcesSearched: NEWS_SOURCES.length
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
