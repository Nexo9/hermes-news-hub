-- Table for site content/texts that can be edited by admins
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Table for platform-wide settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  category text NOT NULL DEFAULT 'general',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Table for email templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  description text,
  variables jsonb DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Table for feature flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  applies_to text NOT NULL DEFAULT 'all',
  conditions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Table for theme configurations
CREATE TABLE public.theme_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  colors jsonb NOT NULL DEFAULT '{}',
  fonts jsonb DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  subscription_required text DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_content
CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active content" ON public.site_content
  FOR SELECT USING (is_active = true);

-- RLS Policies for platform_settings
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view public settings" ON public.platform_settings
  FOR SELECT USING (is_public = true);

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feature_flags
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- RLS Policies for theme_configs
CREATE POLICY "Admins can manage themes" ON public.theme_configs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active themes" ON public.theme_configs
  FOR SELECT USING (is_active = true);

-- Triggers for updated_at
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_configs_updated_at BEFORE UPDATE ON public.theme_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default content
INSERT INTO public.site_content (key, title, content, category, content_type) VALUES
  ('hero_title', 'Titre principal', 'HERMÈS', 'homepage', 'text'),
  ('hero_subtitle', 'Sous-titre', 'INFORMATION NEUTRE ET SOCIALE', 'homepage', 'text'),
  ('hero_description', 'Description', 'Bienvenue sur la plateforme d''information la plus innovante', 'homepage', 'text'),
  ('footer_text', 'Texte footer', '© 2024 HERMÈS - Information neutre et sociale', 'footer', 'text'),
  ('about_text', 'À propos', 'HERMÈS est une plateforme dédiée à l''information neutre et de qualité.', 'about', 'rich_text');

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, description, category, is_public) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Site en maintenance"}', 'Mode maintenance', 'system', true),
  ('registration_enabled', '{"enabled": true}', 'Inscription activée', 'auth', true),
  ('max_thread_length', '{"value": 5000}', 'Longueur max des threads', 'content', true),
  ('news_refresh_interval', '{"value": 300}', 'Intervalle refresh news (sec)', 'content', true),
  ('default_theme', '{"value": "hermes-dark"}', 'Thème par défaut', 'appearance', true),
  ('social_features_enabled', '{"enabled": true}', 'Fonctionnalités sociales', 'features', true),
  ('games_enabled', '{"enabled": true}', 'Mini-jeux activés', 'features', true),
  ('map_enabled', '{"enabled": true}', 'Carte des news activée', 'features', true);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, description, variables) VALUES
  ('welcome', 'Bienvenue sur HERMÈS !', '<h1>Bienvenue {{username}} !</h1><p>Merci de rejoindre HERMÈS.</p>', 'Email de bienvenue', '["username"]'),
  ('verification', 'Code de vérification HERMÈS', '<h1>Votre code : {{code}}</h1>', 'Email de vérification', '["code"]'),
  ('announcement', 'Annonce HERMÈS : {{title}}', '<h1>{{title}}</h1><p>{{content}}</p>', 'Template annonce', '["title", "content"]'),
  ('password_reset', 'Réinitialisation mot de passe', '<h1>Réinitialisez votre mot de passe</h1><a href="{{link}}">Cliquez ici</a>', 'Reset password', '["link"]');

-- Insert default feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, applies_to) VALUES
  ('dark_mode', 'Mode sombre', true, 'all'),
  ('ai_chat', 'Chat Antik-IA', true, 'all'),
  ('advanced_search', 'Recherche avancée', true, 'all'),
  ('premium_themes', 'Thèmes premium', true, 'premium'),
  ('elite_features', 'Fonctionnalités élite', true, 'elite'),
  ('beta_features', 'Fonctionnalités beta', false, 'admin');

-- Insert default themes
INSERT INTO public.theme_configs (name, description, colors, fonts, is_default, subscription_required) VALUES
  ('hermes-dark', 'Thème HERMÈS classique', '{"primary": "270 100% 50%", "background": "270 100% 10%", "accent": "270 100% 50%"}', '{"heading": "Inter", "body": "Inter"}', true, 'free'),
  ('hermes-light', 'Thème clair', '{"primary": "270 100% 50%", "background": "0 0% 100%", "accent": "270 100% 50%"}', '{}', false, 'premium'),
  ('cyber-neon', 'Cyber Néon', '{"primary": "180 100% 50%", "background": "220 20% 10%", "accent": "300 100% 50%"}', '{}', false, 'elite');