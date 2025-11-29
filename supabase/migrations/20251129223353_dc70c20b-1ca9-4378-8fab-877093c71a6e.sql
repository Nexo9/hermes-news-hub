-- PHASE 1: Tables pour le moteur de news HERMÈS
-- Table des synthèses de news neutralisées
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_urls TEXT[] NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche et filtres MST (Matrice Spatio-Temporelle)
CREATE INDEX idx_news_category ON public.news(category);
CREATE INDEX idx_news_location ON public.news(location);
CREATE INDEX idx_news_published ON public.news(published_at DESC);

-- Table des threads sociaux
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_threads_news ON public.threads(news_id, created_at DESC);
CREATE INDEX idx_threads_user ON public.threads(user_id);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: News accessibles à tous
CREATE POLICY "News are viewable by everyone" 
  ON public.news FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert news" 
  ON public.news FOR INSERT 
  WITH CHECK (false); -- Sera géré par edge function

-- RLS Policies: Threads accessibles à tous, création par authentifiés
CREATE POLICY "Threads are viewable by everyone" 
  ON public.threads FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create threads" 
  ON public.threads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
  ON public.threads FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" 
  ON public.threads FOR DELETE 
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour threads
CREATE TRIGGER update_threads_updated_at
BEFORE UPDATE ON public.threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();