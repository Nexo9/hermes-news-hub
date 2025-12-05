import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "verification" | "announcement" | "password_reset";
  email: string;
  data?: {
    username?: string;
    code?: string;
    title?: string;
    content?: string;
    resetLink?: string;
  };
}

const getWelcomeEmailHtml = (username: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1A0033; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #2D0050 0%, #1A0033 100%); border-radius: 24px; padding: 40px; border: 1px solid #A800FF;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #A800FF; font-size: 48px; margin: 0; font-weight: bold; letter-spacing: 4px;">HERMÈS</h1>
        <p style="color: #A800FF; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px;">INFORMATION NEUTRE ET SOCIALE</p>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #FFFFFF; font-size: 28px; margin: 0 0 16px 0;">Bienvenue sur HERMÈS, ${username} ! 🎉</h2>
        <p style="color: #CCCCCC; font-size: 16px; line-height: 1.6; margin: 0;">
          Vous faites maintenant partie d'une communauté engagée pour une information neutre et de qualité.
        </p>
      </div>
      <div style="background: rgba(168, 0, 255, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <h3 style="color: #A800FF; font-size: 18px; margin: 0 0 16px 0;">Ce qui vous attend :</h3>
        <ul style="color: #CCCCCC; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>📰 Des actualités neutres et synthétisées</li>
          <li>🗺️ Une carte interactive des news mondiales</li>
          <li>💬 Des discussions enrichissantes avec la communauté</li>
          <li>🤝 Un réseau social intégré pour partager</li>
        </ul>
      </div>
      <div style="text-align: center; border-top: 1px solid rgba(168, 0, 255, 0.3); padding-top: 24px;">
        <p style="color: #888888; font-size: 12px; margin: 0;">
          © 2024 HERMÈS - Information neutre et sociale
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const getVerificationEmailHtml = (code: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1A0033; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #2D0050 0%, #1A0033 100%); border-radius: 24px; padding: 40px; border: 1px solid #A800FF;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #A800FF; font-size: 48px; margin: 0; font-weight: bold; letter-spacing: 4px;">HERMÈS</h1>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">Vérification de votre email 🔐</h2>
        <p style="color: #CCCCCC; font-size: 16px; line-height: 1.6; margin: 0;">
          Utilisez le code ci-dessous pour vérifier votre adresse email.
        </p>
      </div>
      <div style="background: rgba(168, 0, 255, 0.2); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px; border: 2px dashed #A800FF;">
        <p style="color: #CCCCCC; font-size: 14px; margin: 0 0 16px 0;">Votre code de vérification :</p>
        <p style="color: #FFFFFF; font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
      </div>
      <div style="text-align: center;">
        <p style="color: #888888; font-size: 12px; margin: 0;">
          ⏰ Ce code expire dans 10 minutes.<br>
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const getAnnouncementEmailHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1A0033; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #2D0050 0%, #1A0033 100%); border-radius: 24px; padding: 40px; border: 1px solid #A800FF;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #A800FF; font-size: 48px; margin: 0; font-weight: bold; letter-spacing: 4px;">HERMÈS</h1>
        <span style="display: inline-block; background: #A800FF; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 8px;">📢 ANNONCE OFFICIELLE</span>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 24px 0;">${title}</h2>
        <div style="background: rgba(168, 0, 255, 0.1); border-radius: 16px; padding: 24px; text-align: left;">
          <p style="color: #CCCCCC; font-size: 16px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${content}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HERMÈS <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data }: EmailRequest = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "🎉 Bienvenue sur HERMÈS !";
        html = getWelcomeEmailHtml(data?.username || "Nouvel utilisateur");
        break;
      case "verification":
        subject = "🔐 Code de vérification HERMÈS";
        html = getVerificationEmailHtml(data?.code || "000000");
        break;
      case "announcement":
        subject = `📢 HERMÈS: ${data?.title || "Nouvelle annonce"}`;
        html = getAnnouncementEmailHtml(data?.title || "Annonce", data?.content || "");
        break;
      default:
        throw new Error("Type d'email non supporté");
    }

    const emailResponse = await sendEmail(email, subject, html);
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);