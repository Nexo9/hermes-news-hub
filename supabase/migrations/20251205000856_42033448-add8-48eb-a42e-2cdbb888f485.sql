-- Fix RLS policy for conversation_participants to allow any authenticated user to insert
DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create subscriptions table for premium plans
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free', -- free, premium, elite
  is_certified boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view certified users"
ON public.user_subscriptions
FOR SELECT
USING (is_certified = true);

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  verification_code text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email_verifications
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_verifications
CREATE POLICY "Users can view their own verification"
ON public.email_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert verification"
ON public.email_verifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own verification"
ON public.email_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Give Ibrahim (admin) certification by finding his user_id via profiles
INSERT INTO public.user_subscriptions (user_id, plan_type, is_certified)
SELECT p.id, 'elite', true
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions us WHERE us.user_id = p.id
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;