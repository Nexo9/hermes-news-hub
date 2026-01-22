-- Create social_threads table for standalone discussions (not linked to news)
CREATE TABLE public.social_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_thread_replies table for replies
CREATE TABLE public.social_thread_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.social_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.social_thread_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table for social threads
CREATE TABLE public.social_thread_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.social_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Create likes table for social thread replies
CREATE TABLE public.social_reply_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES public.social_thread_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.social_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_thread_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reply_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_threads
CREATE POLICY "Social threads are viewable by everyone" ON public.social_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create social threads" ON public.social_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social threads" ON public.social_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social threads" ON public.social_threads FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_thread_replies
CREATE POLICY "Social replies are viewable by everyone" ON public.social_thread_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create social replies" ON public.social_thread_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social replies" ON public.social_thread_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social replies" ON public.social_thread_replies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_thread_likes
CREATE POLICY "Social thread likes are viewable by everyone" ON public.social_thread_likes FOR SELECT USING (true);
CREATE POLICY "Users can like social threads" ON public.social_thread_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike social threads" ON public.social_thread_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for social_reply_likes
CREATE POLICY "Social reply likes are viewable by everyone" ON public.social_reply_likes FOR SELECT USING (true);
CREATE POLICY "Users can like social replies" ON public.social_reply_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike social replies" ON public.social_reply_likes FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for social threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_thread_replies;