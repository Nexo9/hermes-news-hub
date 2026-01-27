import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsId, title, summary, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating image for news: ${title}`);

    // Create a detailed prompt based on the news content
    const imagePrompt = `Create a professional, high-quality news illustration for this article. Style: modern photojournalism, documentary photography style. 
    
News Title: ${title}
Category: ${category}
Summary: ${summary?.slice(0, 200) || ''}

Requirements:
- Ultra realistic, editorial quality
- No text or watermarks
- 16:9 aspect ratio suitable for news
- Professional lighting and composition
- Relevant to the news topic
- If about politics: show relevant landmarks, flags, or symbolic imagery
- If about technology: show modern devices, circuits, or futuristic elements
- If about sports: show action, athletes, or sports equipment
- If about science: show laboratories, experiments, or nature
- If about environment: show nature, climate, or environmental scenes`;

    // Generate unique image using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: imagePrompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI image generation error:", errorText);
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    // If we have a newsId, store the image URL in the database
    if (newsId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Upload to storage
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `news-${newsId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(`news-images/${fileName}`, imageBytes, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
      } else {
        const { data: publicUrl } = supabase.storage
          .from('message-media')
          .getPublicUrl(`news-images/${fileName}`);
        
        console.log("Image uploaded:", publicUrl.publicUrl);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl: publicUrl.publicUrl,
            imageData: imageData 
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, imageData }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
