-- News likes table
CREATE TABLE public.news_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can like news" ON public.news_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike news" ON public.news_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Likes are viewable by everyone" ON public.news_likes FOR SELECT USING (true);

-- News favorites table
CREATE TABLE public.news_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_id)
);

ALTER TABLE public.news_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can favorite news" ON public.news_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfavorite news" ON public.news_favorites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their favorites" ON public.news_favorites FOR SELECT USING (auth.uid() = user_id);

-- News shares table (share to friends)
CREATE TABLE public.news_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can share news" ON public.news_shares FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view shares they sent or received" ON public.news_shares FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Make Ibrahim admin
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.username = 'Ibrahim'
ON CONFLICT (user_id, role) DO NOTHING;