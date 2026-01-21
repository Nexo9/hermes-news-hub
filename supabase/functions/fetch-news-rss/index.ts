import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS feeds from major news sources (free and public)
const RSS_FEEDS = [
  { url: 'https://www.lemonde.fr/rss/une.xml', source: 'Le Monde' },
  { url: 'https://www.francetvinfo.fr/titres.rss', source: 'France Info' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times' },
  { url: 'https://www.rfi.fr/fr/rss', source: 'RFI' },
];

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

async function fetchRSSFeed(feedUrl: string, source: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'HERMES-News-Bot/1.0' }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${feedUrl}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items: RSSItem[] = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 5)) { // Max 5 per source
      const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      
      if (title && description) {
        items.push({
          title: title.replace(/<[^>]*>/g, '').trim(),
          description: description.replace(/<[^>]*>/g, '').slice(0, 500).trim(),
          link,
          pubDate,
          source
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching ${feedUrl}:`, error);
    return [];
  }
}

async function synthesizeWithAI(items: RSSItem[]): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return [];
  }

  // Group items by similar topics for synthesis
  const synthesizedNews: any[] = [];
  
  // Process in batches of 3-4 items for synthesis
  for (let i = 0; i < Math.min(items.length, 15); i += 3) {
    const batch = items.slice(i, i + 3);
    
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Tu es HERMÈS, un synthétiseur d'actualités neutre et factuel. Ta mission:
1. Analyser les articles fournis
2. Créer une synthèse neutre et objective
3. Catégoriser correctement (politique, économie, technologie, sport, culture, science, santé, environnement, autre)
4. Identifier la localisation géographique principale
5. Éliminer tout biais ou langage émotionnel

Réponds UNIQUEMENT en JSON valide.`
            },
            {
              role: 'user',
              content: `Synthétise ces actualités en UNE seule actualité neutre:

${batch.map((item, idx) => `
ARTICLE ${idx + 1} (${item.source}):
Titre: ${item.title}
Description: ${item.description}
URL: ${item.link}
`).join('\n')}

Réponds avec ce JSON exact:
{
  "title": "Titre factuel et neutre (max 100 caractères)",
  "summary": "Synthèse neutre en 2-3 phrases (max 300 caractères)",
  "category": "politique|économie|technologie|sport|culture|science|santé|environnement|autre",
  "location": "Pays ou région principale (ex: France, Europe, Monde)",
  "source_urls": ["url1", "url2"]
}`
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error('AI API error:', response.status);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        synthesizedNews.push({
          ...parsed,
          source_urls: parsed.source_urls || batch.map(b => b.link).filter(Boolean)
        });
      }
    } catch (error) {
      console.error('Error synthesizing batch:', error);
    }
  }

  return synthesizedNews;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting RSS news fetch...');
    
    // Fetch all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed.url, feed.source));
    const feedResults = await Promise.all(feedPromises);
    
    // Flatten all items
    const allItems = feedResults.flat();
    console.log(`Fetched ${allItems.length} items from ${RSS_FEEDS.length} sources`);
    
    if (allItems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No items fetched from RSS feeds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Synthesize with AI
    const synthesizedNews = await synthesizeWithAI(allItems);
    console.log(`Synthesized ${synthesizedNews.length} news items`);

    if (synthesizedNews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI synthesis failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert new news items
    const { data: insertedData, error: insertError } = await supabase
      .from('news')
      .insert(synthesizedNews.map(item => ({
        title: item.title,
        summary: item.summary,
        category: item.category,
        location: item.location,
        source_urls: item.source_urls,
        published_at: new Date().toISOString()
      })))
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} news items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${insertedData?.length || 0} actualités ajoutées`,
        count: insertedData?.length || 0,
        items: insertedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news-rss:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
