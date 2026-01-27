import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, summary, sourceUrls, category, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating full article for: ${title}`);

    // Fetch content from source URLs for context
    let sourceContext = "";
    for (const url of sourceUrls?.slice(0, 3) || []) {
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'HERMES-Bot/1.0' }
        });
        if (resp.ok) {
          const html = await resp.text();
          // Extract text content (simplified)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 2000);
          sourceContext += `\n\nSource (${new URL(url).hostname}):\n${textContent}`;
        }
      } catch (e) {
        console.log(`Could not fetch ${url}`);
      }
    }

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
            content: `Tu es Antik-IA, le rédacteur en chef de HERMÈS, une plateforme d'information neutre et factuelle.

Ta mission est de rédiger des articles complets, neutres et informatifs basés sur les sources fournies.

Règles importantes:
1. NEUTRALITÉ ABSOLUE - Pas d'opinion, pas de biais politique ou idéologique
2. FACTUEL - Uniquement des faits vérifiables
3. ÉQUILIBRÉ - Présenter tous les points de vue quand applicable
4. PROFESSIONNEL - Style journalistique de qualité
5. STRUCTURÉ - Introduction, développement, conclusion
6. CITANT LES SOURCES - Mentionner d'où viennent les informations

Format de l'article:
- Titre accrocheur mais factuel
- Chapeau (résumé en 2-3 phrases)
- Corps de l'article (5-8 paragraphes)
- Contexte et analyse factuelle
- Conclusion ou perspectives

Signe toujours: "— Rédigé par Antik-IA pour HERMÈS"`
          },
          {
            role: "user",
            content: `Rédige un article complet sur ce sujet:

TITRE: ${title}
RÉSUMÉ: ${summary}
CATÉGORIE: ${category}
LOCALISATION: ${location}
SOURCES: ${sourceUrls?.join(', ') || 'Non disponibles'}

${sourceContext ? `CONTENU DES SOURCES:${sourceContext}` : ''}

Rédige un article complet, professionnel et neutre en français.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate article");
    }

    const data = await response.json();
    const article = data.choices?.[0]?.message?.content || "Article non disponible.";

    return new Response(
      JSON.stringify({ success: true, article }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error generating article:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
