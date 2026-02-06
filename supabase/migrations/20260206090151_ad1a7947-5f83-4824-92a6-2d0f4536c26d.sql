
-- Add tutorial tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tutorial_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tutorial_step integer DEFAULT 0;
