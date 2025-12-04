-- Table pour les signalements d'utilisateurs
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Policies for user_reports
CREATE POLICY "Users can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.user_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.user_reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Table pour les messages système (annonces visibles dans messagerie)
CREATE TABLE public.system_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.system_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read active system messages
CREATE POLICY "System messages are viewable by everyone" ON public.system_messages
  FOR SELECT USING (is_active = true);

-- Admins can manage system messages
CREATE POLICY "Admins can manage system messages" ON public.system_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Fix conversation_participants RLS to allow adding other users
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Enable realtime for system_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reports;