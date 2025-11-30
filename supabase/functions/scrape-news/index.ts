import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      throw new Error('URLs array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Scraping URLs:', urls);

    // Fetch content from URLs
    const contents = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          
          // Basic text extraction (remove HTML tags)
          const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          return { url, text: text.slice(0, 10000) }; // Limit to 10k chars per source
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return { url, text: '' };
        }
      })
    );

    const validContents = contents.filter(c => c.text.length > 0);
    
    if (validContents.length === 0) {
      throw new Error('Could not fetch any content from the provided URLs');
    }

    // Generate neutral synthesis using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Tu es HERMÈS Antik IA, un assistant spécialisé dans la synthèse neutre d\'informations. Ta mission est d\'extraire les faits essentiels de plusieurs sources et de créer une synthèse objective, sans biais ni opinion. Utilise une approche extractive inspirée de LexRank pour identifier les phrases les plus importantes. Préserve toujours l\'attribution des sources.'
          },
          {
            role: 'user',
            content: `Crée une synthèse neutre et factuelle à partir des sources suivantes. Extrais uniquement les faits vérifiables et élimine tout langage émotionnel ou biaisé. Formate ta réponse en JSON avec cette structure:
{
  "title": "Titre factuel de l'événement",
  "summary": "Synthèse neutre en 2-3 paragraphes maximum",
  "category": "politique|économie|technologie|sport|autre",
  "location": "Lieu géographique principal"
}

Sources:
${validContents.map((c, i) => `Source ${i + 1} (${c.url}):\n${c.text.slice(0, 5000)}`).join('\n\n---\n\n')}`,
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate synthesis');
    }

    const aiData = await aiResponse.json();
    const synthesisText = aiData.choices[0].message.content;
    
    // Parse JSON response
    const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const synthesis = JSON.parse(jsonMatch[0]);

    console.log('Generated synthesis:', synthesis);

    return new Response(
      JSON.stringify({
        ...synthesis,
        source_urls: urls,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});